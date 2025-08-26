import Link from 'next/link';
import Image from 'next/image';
import { TextInput } from './Input';

export default function NavBar() {
  return (
    <header className="flex items-center justify-between bg-gradient-to-b from-nav-deep to-nav px-4 py-2 border-b border-nav-hover shadow-md">
      <div className="flex items-center gap-2 font-bold text-white">
        <Image src="/logo.svg" alt="SassUI" width={32} height={32} />
        <span>SassUI</span>
      </div>
      <nav className="flex gap-4 text-gray-300">
        <Link className="px-2 py-1 rounded-md hover:bg-nav-hover hover:text-white transition-colors" href="/">首页</Link>
        <Link className="px-2 py-1 rounded-md hover:bg-nav-hover hover:text-white transition-colors" href="/dashboard">仪表盘</Link>
        <Link className="px-2 py-1 rounded-md hover:bg-nav-hover hover:text-white transition-colors" href="/users">用户管理</Link>
        <Link className="px-2 py-1 rounded-md hover:bg-nav-hover hover:text-white transition-colors" href="/orders">订单查询</Link>
      </nav>
      <div>
        <TextInput
          placeholder="搜索..."
          className="h-8 w-48 bg-nav-sub text-indigo-50 placeholder-indigo-200 border border-nav-hover focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>
    </header>
  );
}
