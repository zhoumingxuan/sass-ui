"use client";

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, File, Loader2 } from "lucide-react";

export type Key = string;

export type TreeNode = {
  key: Key;
  title: ReactNode;
  children?: TreeNode[];
  disabled?: boolean;
  isLeaf?: boolean;
  icon?: ReactNode;
  selectable?: boolean; // override
  checkable?: boolean;   // override
};

type SelectMode = "single" | "multiple";

type Props = {
  data: TreeNode[];
  className?: string;
  selectable?: SelectMode | boolean; // true => single
  checkable?: boolean;
  loading?: boolean;
  emptyText?: ReactNode;
  keyword?: string; // highlight query (case-insensitive) for UX
  expandedKeys?: Key[];
  defaultExpandedKeys?: Key[];
  selectedKeys?: Key[];
  defaultSelectedKeys?: Key[];
  checkedKeys?: Key[];
  defaultCheckedKeys?: Key[];
  onExpand?: (keys: Key[]) => void;
  onSelect?: (keys: Key[], info: { selected: boolean; node: TreeNode }) => void;
  onCheck?: (keys: Key[], info: { checked: boolean; node: TreeNode; halfCheckedKeys: Key[] }) => void;
  loadData?: (node: TreeNode) => Promise<TreeNode[]>; // async load children
  onContextMenu?: (node: TreeNode, e: React.MouseEvent) => void;
};

export default function Tree({
  data,
  className = "",
  selectable = false,
  checkable = false,
  loading = false,
  emptyText,
  keyword = '',
  expandedKeys,
  defaultExpandedKeys = [],
  selectedKeys,
  defaultSelectedKeys = [],
  checkedKeys,
  defaultCheckedKeys = [],
  onExpand,
  onSelect,
  onCheck,
  loadData,
  onContextMenu,
}: Props) {
  // Controlled/uncontrolled sets
  const isExpandedControlled = Array.isArray(expandedKeys);
  const isSelectedControlled = Array.isArray(selectedKeys);
  const isCheckedControlled = Array.isArray(checkedKeys);
  const [internalExpanded, setInternalExpanded] = useState<Set<Key>>(new Set(defaultExpandedKeys));
  const [internalSelected, setInternalSelected] = useState<Set<Key>>(new Set(defaultSelectedKeys));
  const [internalChecked, setInternalChecked] = useState<Set<Key>>(new Set(defaultCheckedKeys));

  const expanded = useMemo(() => new Set(isExpandedControlled ? expandedKeys : Array.from(internalExpanded)), [expandedKeys, internalExpanded, isExpandedControlled]);
  const selected = useMemo(() => new Set(isSelectedControlled ? selectedKeys : Array.from(internalSelected)), [selectedKeys, internalSelected, isSelectedControlled]);
  const checked = useMemo(() => new Set(isCheckedControlled ? checkedKeys : Array.from(internalChecked)), [checkedKeys, internalChecked, isCheckedControlled]);

  // Loading states for async load
  const [loadingKeys, setLoadingKeys] = useState<Set<Key>>(new Set());
  const [dynamicChildren, setDynamicChildren] = useState<Record<Key, TreeNode[]>>({});

  // Build node map and parent map for fast operations
  const flatMap = useMemo(() => {
    const map = new Map<Key, TreeNode & { parent?: Key; depth: number }>();
    const walk = (items: TreeNode[], parent?: Key, depth: number = 0) => {
      for (const n of items) {
        map.set(n.key, { ...n, parent, depth });
        const children = (dynamicChildren[n.key] ?? n.children) || [];
        if (children && children.length) walk(children, n.key, depth + 1);
      }
    };
    walk(data, undefined, 0);
    return map;
  }, [data, dynamicChildren]);

  const getChildren = useCallback((n: TreeNode): TreeNode[] => (dynamicChildren[n.key] ?? n.children) || [], [dynamicChildren]);
  const getActiveChildren = useCallback((n: TreeNode): TreeNode[] => (getChildren(n) || []).filter(c => !c.disabled), [getChildren]);

  // Derive half-checked keys from children state
  const { halfChecked } = useMemo(() => {
    if (!checkable) return { halfChecked: new Set<Key>() };
    const half = new Set<Key>();
    // Reverse topological walk: compute from leaves up
    const nodes = Array.from(flatMap.values()).sort((a, b) => b.depth - a.depth);
    const isChecked = (k: Key) => checked.has(k);
    for (const n of nodes) {
      const children = getActiveChildren(n) || [];
      if (!children.length) continue;
      let cChecked = 0;
      const cTotal = children.length;
      for (const c of children) {
        if (checked.has(c.key)) cChecked++;
        if (half.has(c.key)) half.add(n.key); // any half child bubbles up
      }
      if (cTotal > 0 && cChecked > 0 && cChecked < cTotal) half.add(n.key);
    }
    return { halfChecked: half };
  }, [checkable, flatMap, checked, getActiveChildren]);

  const toggleExpand = async (node: TreeNode) => {
    const next = new Set(expanded);
    if (next.has(node.key)) next.delete(node.key);
    else {
      next.add(node.key);
      if (loadData && !node.isLeaf && (!node.children || node.children.length === 0) && !dynamicChildren[node.key]) {
        setLoadingKeys(prev => new Set(prev).add(node.key));
        try {
          const children = await loadData(node);
          setDynamicChildren(prev => ({ ...prev, [node.key]: children }));
        } finally {
          setLoadingKeys(prev => { const n = new Set(prev); n.delete(node.key); return n; });
        }
      }
    }
    if (!isExpandedControlled) setInternalExpanded(next);
    onExpand?.(Array.from(next));
  };

  const inSelectMode = !!selectable;
  const selectMode: SelectMode = selectable === true ? "single" : selectable === false ? "single" : (selectable as SelectMode);
  const doSelect = (node: TreeNode) => {
    if (node.disabled) return;
    if (!inSelectMode) return;
    const next = new Set(selected);
    let selectedFlag = true;
    if (selectMode === "single") {
      next.clear();
      next.add(node.key);
    } else {
      if (next.has(node.key)) { next.delete(node.key); selectedFlag = false; } else next.add(node.key);
    }
    if (!isSelectedControlled) setInternalSelected(next);
    onSelect?.(Array.from(next), { selected: selectedFlag, node });
  };

  const descendants = useCallback((node: TreeNode): Key[] => {
    const out: Key[] = [];
    const walk = (n: TreeNode) => {
      const cs = getChildren(n);
      for (const c of cs) { out.push(c.key); walk(c); }
    };
    walk(node);
    return out;
  }, [getChildren]);

  const ancestors = useCallback((key: Key): Key[] => {
    const out: Key[] = [];
    let cur = flatMap.get(key)?.parent;
    while (cur) { out.push(cur); cur = flatMap.get(cur)?.parent; }
    return out;
  }, [flatMap]);

  const toggleCheck = (node: TreeNode) => {
    if (!checkable || node.disabled) return;
    const next = new Set(checked);
    const keysToFlip = [node.key, ...descendants(node)];
    const turnOn = !checked.has(node.key);
    for (const k of keysToFlip) { if (turnOn) next.add(k); else next.delete(k); }

    // Recompute ancestors state from bottom to top:
    const parents = ancestors(node.key);
    for (const pKey of parents) {
      const p = flatMap.get(pKey);
      if (!p) continue;
      const cs = getActiveChildren(p);
      if (cs.length === 0) continue;
      const checkedCnt = cs.filter(c => next.has(c.key)).length;
      if (checkedCnt === cs.length) {
        next.add(pKey); // all children checked -> parent checked
      } else if (checkedCnt === 0) {
        next.delete(pKey); // none checked -> parent unchecked
      } else {
        next.delete(pKey); // some checked -> parent half (via derived half set), not fully checked
      }
    }

    // Compose halfChecked for callback info
    const halfAfter = new Set<Key>();
    for (const pKey of parents) {
      const p = flatMap.get(pKey);
      if (!p) continue;
      const cs = getActiveChildren(p);
      const cnt = cs.length;
      const cntChecked = cs.filter(c => next.has(c.key)).length;
      if (cnt > 0 && cntChecked > 0 && cntChecked < cnt) halfAfter.add(pKey);
    }

    if (!isCheckedControlled) setInternalChecked(next);
    onCheck?.(Array.from(next), { checked: turnOn, node, halfCheckedKeys: Array.from(halfAfter) });
  };

  const renderIcon = (n: TreeNode, isOpen: boolean) => {
    if (n.icon) return <span className="text-gray-500">{n.icon}</span>;
    if (n.isLeaf || (getChildren(n)?.length === 0 && !loadingKeys.has(n.key))) return <File size={16} className="text-gray-400" aria-hidden />;
    return isOpen ? <FolderOpen size={16} className="text-primary/80" aria-hidden /> : <Folder size={16} className="text-gray-500" aria-hidden />;
  };

  const highlight = (title: ReactNode): ReactNode => {
    if (!keyword || typeof title !== 'string') return title;
    const q = keyword.trim();
    if (!q) return title;
    const idx = title.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return title;
    const before = title.slice(0, idx);
    const match = title.slice(idx, idx + q.length);
    const after = title.slice(idx + q.length);
    return (
      <>
        {before}
        <span className="text-warning">{match}</span>
        {after}
      </>
    );
  };

  const Row = ({ node }: { node: TreeNode }) => {
    const depth = flatMap.get(node.key)?.depth ?? 0;
    const isOpen = expanded.has(node.key);
    const hasChildren = (getChildren(node)?.length ?? 0) > 0;
    const isLoading = loadingKeys.has(node.key);
    const isSelected = selected.has(node.key);
    const isChecked = checked.has(node.key);
    const isHalf = halfChecked.has(node.key);
    const effectiveSelectable = node.selectable ?? !!selectable;
    const effectiveCheckable = node.checkable ?? !!checkable;

    return (
      <div
        role="treeitem"
        aria-expanded={hasChildren ? isOpen : undefined}
        aria-selected={effectiveSelectable ? isSelected : undefined}
        onClick={() => effectiveSelectable && doSelect(node)}
        onContextMenu={(e) => { e.preventDefault(); onContextMenu?.(node, e); }}
        className={[
          "group flex items-center gap-2 h-8 rounded-md px-2 text-sm",
          node.disabled ? "text-gray-400 cursor-not-allowed" : (isSelected ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"),
        ].join(" ")}
        style={{ paddingLeft: 8 + depth * 16 }}
      >
        {/* Expand/Collapse */}
        <button
          type="button"
          aria-label={isOpen ? "折叠" : "展开"}
          onClick={(e) => { e.stopPropagation(); if (!node.isLeaf && (hasChildren || loadData)) toggleExpand(node); }}
          disabled={node.isLeaf || (!hasChildren && !loadData)}
          className={[
            "inline-flex h-5 w-5 items-center justify-center",
            node.isLeaf || (!hasChildren && !loadData) ? "text-gray-300 cursor-default" : "text-gray-500 hover:text-gray-700 cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-0"
          ].join(" ")}
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" aria-hidden />
          ) : node.isLeaf || (!hasChildren && !loadData) ? (
            <span className="inline-block w-5 h-5" aria-hidden />
          ) : (
            isOpen ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />
          )}
        </button>

        {/* Checkable */}
        {effectiveCheckable && (
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => toggleCheck(node)}
            aria-checked={isHalf ? "mixed" : isChecked}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30 disabled:opacity-50"
            disabled={node.disabled}
            onClick={(e) => e.stopPropagation()}
            ref={(el) => { if (el) el.indeterminate = isHalf && !isChecked; }}
          />
        )}

        {/* Icon and label */}
        <span className="inline-flex items-center gap-2">
          {renderIcon(node, isOpen)}
          <span>{highlight(node.title)}</span>
        </span>
      </div>
    );
  };

  const render = (nodes: TreeNode[]) => (
    <div role="group">
      {nodes.map((n) => (
        <div key={n.key}>
          <Row node={n} />
          {expanded.has(n.key) && ((getChildren(n)?.length ?? 0) > 0) && (
            <div role="group">
              {render(getChildren(n) || [])}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const showEmpty = !loading && (!data || data.length === 0);

  return (
    <div role="tree" className={["select-none", className].join(" ")}> 
      {loading && (!data || data.length === 0) ? (
        <div className="py-6 px-3 text-sm text-gray-500 inline-flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" aria-hidden /> 加载中...
        </div>
      ) : showEmpty ? (
        <div className="py-6 px-3 text-sm text-gray-400">{emptyText ?? '暂无数据'}</div>
      ) : (
        render(data)
      )}
    </div>
  );
}
