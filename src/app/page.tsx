"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { menuItems, footerItems } from "@/components/menuItems";
import Button from "@/components/Button";
import Card from "@/components/Card";
import {
  TextInput,
  NumberInput,
  PasswordInput,
  SelectInput,
  DateInput,
  DateRangeInput,
} from "@/components/Input";
import Table, { Column } from "@/components/Table";
import Alert from "@/components/Alert";
import { Plus, Search, Check, AlertTriangle, Info, ArrowRight, Download } from "lucide-react";

type Row = {
  id: string;
  name: string;
  role: string;
  department: string;
  age: number;
  email: string;
  status: "active" | "trial" | "leave" | "suspended";
  updatedAt: string;
};

const STATUS_TEXT: Record<Row["status"], string> = {
  active: "在岗",
  trial: "试用期",
  leave: "离岗",
  suspended: "停用",
};

const MEMBERS: Row[] = [
  {
    id: "EMP-001",
    name: "张三",
    role: "产品经理",
    department: "产品中心",
    age: 28,
    email: "zhangsan@example.com",
    status: "active",
    updatedAt: "2025-09-15 10:12",
  },
  {
    id: "EMP-002",
    name: "李四",
    role: "前端开发",
    department: "研发中心",
    age: 32,
    email: "lisi@example.com",
    status: "trial",
    updatedAt: "2025-09-13 09:48",
  },
  {
    id: "EMP-003",
    name: "王五",
    role: "UI 设计师",
    department: "设计体验",
    age: 26,
    email: "wangwu@example.com",
    status: "active",
    updatedAt: "2025-09-12 16:05",
  },
  {
    id: "EMP-004",
    name: "赵六",
    role: "测试工程师",
    department: "质量保障",
    age: 30,
    email: "zhaoliu@example.com",
    status: "leave",
    updatedAt: "2025-09-10 11:37",
  },
  {
    id: "EMP-005",
    name: "钱七",
    role: "数据分析",
    department: "数据平台",
    age: 29,
    email: "qianqi@example.com",
    status: "suspended",
    updatedAt: "2025-09-08 08:22",
  },
  {
    id: "EMP-006",
    name: "孙八",
    role: "运营主管",
    department: "运营中心",
    age: 34,
    email: "sunba@example.com",
    status: "active",
    updatedAt: "2025-09-07 14:55",
  },
];

export default function Home() {
  const columns: Column<Row>[] = useMemo(
    () => [
      { key: "name", title: "姓名", minWidth: 160, flex: 1.2, sortable: true },
      { key: "role", title: "职位", minWidth: 160, flex: 1, tooltip: (row) => row.role },
      { key: "department", title: "部门", minWidth: 160, flex: 1 },
      {
        key: "status",
        title: "状态",
        minWidth: 140,
        sortable: true,
        render: (row) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              row.status === "active"
                ? "bg-success/10 text-success"
                : row.status === "trial"
                ? "bg-primary/10 text-primary"
                : row.status === "leave"
                ? "bg-warning/10 text-warning"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {STATUS_TEXT[row.status]}
          </span>
        ),
      },
      { key: "age", title: "年龄", align: "right", minWidth: 80, sortable: true },
      {
        key: "email",
        title: "邮箱",
        minWidth: 220,
        flex: 1.6,
        tooltip: (row) => row.email,
      },
      {
        key: "updatedAt",
        title: "最近更新",
        minWidth: 180,
        sortable: true,
        render: (row) => row.updatedAt,
      },
      {
        key: "actions",
        title: "操作",
        intent: "actions",
        align: "right",
        minWidth: 200,
        render: () => (
          <div className="flex items-center justify-end gap-2" data-table-row-trigger="ignore">
            <Button size="small" appearance="ghost" variant="default">
              查看
            </Button>
            <Button size="small" appearance="ghost" variant="primary">
              编辑
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<keyof Row>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selectedKeys, setSelectedKeys] = useState<Array<string | number>>([]);
  const [selectedRows, setSelectedRows] = useState<Row[]>([]);
  const [focusedMember, setFocusedMember] = useState<Row | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? MEMBERS.filter((member) => {
          const haystack = [
            member.name,
            member.role,
            member.department,
            member.email,
            STATUS_TEXT[member.status],
            member.updatedAt,
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        })
      : MEMBERS.slice();

    base.sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      switch (sortKey) {
        case "age":
          return (a.age - b.age) * direction;
        case "status": {
          const order: Record<Row["status"], number> = {
            suspended: 0,
            leave: 1,
            trial: 2,
            active: 3,
          };
          return (order[a.status] - order[b.status]) * direction;
        }
        case "updatedAt": {
          const parse = (value: string) => new Date(value.replace(" ", "T")).getTime();
          return (parse(a.updatedAt) - parse(b.updatedAt)) * direction;
        }
        default:
          return (
            String(a[sortKey]).localeCompare(String(b[sortKey]), "zh", { numeric: true }) * direction
          );
      }
    });

    return base;
  }, [query, sortDirection, sortKey]);

  useEffect(() => {
    setSelectedKeys((keys) => {
      const next = keys.filter((key) => filtered.some((row) => row.id === key));
      return next.length === keys.length ? keys : next;
    });
    setSelectedRows((rows) => {
      const next = rows.filter((row) => filtered.some((item) => item.id === row.id));
      return next.length === rows.length ? rows : next;
    });
  }, [filtered]);

  const total = filtered.length;
  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const sortableFields: Array<keyof Row> = ["name", "age", "status", "updatedAt"];
  const handleSort = (key: Column<Row>["key"]) => {
    if (!sortableFields.includes(key as keyof Row)) {
      return;
    }
    const normalized = key as keyof Row;
    if (normalized === sortKey) {
      setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(normalized);
      setSortDirection("asc");
    }
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handlePageSize = (nextSize: number) => {
    setPageSize(nextSize);
    setPage(1);
  };

  const focusHint = focusedMember ? `当前聚焦成员：${focusedMember.name}` : "选择或使用上下键查看详情";

  return (
    <Layout
      menuItems={menuItems}
      footerItems={footerItems}
      header={<div className="text-xl font-semibold text-gray-800">Sass UI Demo</div>}
    >
      <Card title="按钮">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <Button size="large" variant="primary">大按钮</Button>
            <Button size="large" variant="default">大按钮</Button>
            <Button size="large" variant="success">大按钮</Button>
            <Button size="large" variant="warning">大按钮</Button>
            <Button size="large" variant="error">大按钮</Button>
            <Button size="large" variant="info">大按钮</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">中按钮</Button>
            <Button variant="default">中按钮</Button>
            <Button variant="success">中按钮</Button>
            <Button variant="warning">中按钮</Button>
            <Button variant="error">中按钮</Button>
            <Button variant="info">中按钮</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="small" variant="primary">小按钮</Button>
            <Button size="small" variant="default">小按钮</Button>
            <Button size="small" variant="success">小按钮</Button>
            <Button size="small" variant="warning">小按钮</Button>
            <Button size="small" variant="error">小按钮</Button>
            <Button size="small" variant="info">小按钮</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" icon={<Plus />}>新增</Button>
            <Button appearance="ghost" variant="default" icon={<Search />}>搜索</Button>
            <Button variant="success" icon={<Check />}>提交</Button>
            <Button variant="warning" icon={<AlertTriangle />}>警告</Button>
            <Button variant="error" icon={<AlertTriangle />}>错误</Button>
            <Button variant="info" icon={<Info />}>信息</Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="primary" icon={<ArrowRight />} iconPosition="right">下一步</Button>
            <Button variant="primary" aria-label="新增" icon={<Plus />} />
            <Button variant="primary" icon={<Plus />} disabled>禁用</Button>
          </div>
        </div>
      </Card>

      <Card title="输入">
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 md:col-span-6"><TextInput label="文本输入" placeholder="请输入文本" /></div>
          <div className="col-span-12 md:col-span-6"><NumberInput label="数字输入" placeholder="请输入数字" /></div>
          <div className="col-span-12 md:col-span-6"><PasswordInput label="密码输入" placeholder="请输入密码" /></div>
          <div className="col-span-12 md:col-span-6">
            <SelectInput label="选择输入" options={[{ value: "", label: "请选择" }, { value: "1", label: "选项1" }]} />
          </div>
          <div className="col-span-12 md:col-span-6"><DateInput label="日期输入" /></div>
          <div className="col-span-12 md:col-span-6"><DateRangeInput label="日期范围" /></div>
        </div>
      </Card>

      <div className="mb-3 text-sm text-gray-500">{focusHint}</div>
      <Table<Row>
        title="员工"
        columns={columns}
        data={paged}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={handlePageSize}
        pageSizeOptions={[5, 10, 20]}
        onSearch={handleSearch}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        rowKey={(row) => row.id}
        selection={{
          selectedKeys,
          onChange: (keys, rows) => {
            setSelectedKeys(keys);
            setSelectedRows(rows);
          },
          columnWidth: 48,
          headerTitle: "选择全部成员",
        }}
        toolbar={
          <div className="flex items-center gap-2">
            <Button size="small" variant="primary" icon={<Plus />}>
              新增成员
            </Button>
            <Button size="small" appearance="ghost" variant="default" icon={<Download />}>
              导出
            </Button>
          </div>
        }
        onFocusedRowChange={(_, row) => setFocusedMember(row)}
        footerExtra={
          selectedRows.length > 0 ? (
            <div className="flex items-center gap-2 text-gray-500">
              <span>批量操作：</span>
              <Button size="small" appearance="ghost" variant="default">
                导出选中
              </Button>
            </div>
          ) : null
        }
      />

      <Card title="提示">
        <div className="flex flex-col space-y-3">
          <Alert variant="success">操作成功</Alert>
          <Alert variant="warning">警告信息</Alert>
          <Alert variant="error">错误信息</Alert>
          <Alert variant="info">提示信息</Alert>
        </div>
      </Card>
    </Layout>
  );
}