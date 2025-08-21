import Card from "@/components/Card";

export default function Dashboard() {
  return (
    <div className="grid [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))] gap-4">
      <Card title="今日访问量">1,234</Card>
      <Card title="新增用户">56</Card>
      <Card title="订单总数">789</Card>
    </div>
  );
}
