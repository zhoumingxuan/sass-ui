import Card from "@/components/Card";
import styles from "./dashboard.module.scss";

export default function Dashboard() {
  return (
    <div className={styles.grid}>
      <Card title="今日访问量">1,234</Card>
      <Card title="新增用户">56</Card>
      <Card title="订单总数">789</Card>
    </div>
  );
}
