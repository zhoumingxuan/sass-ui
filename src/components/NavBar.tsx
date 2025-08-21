import Link from 'next/link';
import Image from 'next/image';

export default function NavBar() {
  return (
    <header className="flex items-center justify-between bg-white px-4 py-2 border-b">
      <div className="flex items-center gap-2 font-bold text-primary">
        <Image src="/logo.svg" alt="SassUI" width={32} height={32} />
        <span>SassUI</span>
      </div>
      <nav className="flex gap-4">
        <Link href="/">首页</Link>
        <Link href="/dashboard">仪表盘</Link>
        <Link href="/users">用户管理</Link>
        <Link href="/orders">订单查询</Link>
      </nav>
      <div>
        <input
          type="text"
          placeholder="搜索..."
          className="p-1 px-2 border border-gray-300 rounded"
        />
      </div>
    </header>
  );
}
