import Link from "next/link";
import styles from "./home.module.scss";

export default function Home() {
  return (
    <div className={styles.home}>
      <h1>Sass UI 示例</h1>
      <nav>
        <Link href="/dashboard">仪表盘</Link>
        <Link href="/users">用户管理</Link>
        <Link href="/orders">订单查询</Link>
      </nav>
    </div>
  );
}
