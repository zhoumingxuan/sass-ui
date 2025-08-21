import Link from 'next/link';
import Image from 'next/image';
import styles from './NavBar.module.scss';

export default function NavBar() {
  return (
    <header className={styles.navbar}>
      <div className={styles.logo}>
        <Image src="/logo.svg" alt="SassUI" width={32} height={32} />
        <span>SassUI</span>
      </div>
      <nav className={styles.menu}>
        <Link href="/">首页</Link>
        <Link href="/dashboard">仪表盘</Link>
        <Link href="/users">用户管理</Link>
        <Link href="/orders">订单查询</Link>
      </nav>
      <div className={styles.search}>
        <input type="text" placeholder="搜索..." />
      </div>
    </header>
  );
}
