"use client";

import Card from "@/components/Card";
import Grid from "@/components/Grid";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function Dashboard() {
  return (
    <>
      <Breadcrumbs />
      <Grid cols={3} gap={2} className="max-md:grid-cols-2">
        <Card title="今日访问量">1,234</Card>
        <Card title="新增用户">56</Card>
        <Card title="订单总数">789</Card>
      </Grid>
    </>
  );
}
