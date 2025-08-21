'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import styles from './orders.module.scss';

export default function Orders() {
  const [showMore, setShowMore] = useState(false);
  return (
    <div>
      <h2>订单查询</h2>
      <Card>
        <form className={styles.filters}>
          <div className={styles.row}>
            <input placeholder="订单号" />
            <input placeholder="客户名" />
            <input type="date" placeholder="日期从" />
            <input type="date" placeholder="日期至" />
          </div>
          {showMore && (
            <>
              <div className={styles.row}>
                <select>
                  <option>状态</option>
                </select>
                <input type="number" placeholder="金额最小值" />
                <input type="number" placeholder="金额最大值" />
              </div>
              <div className={styles.row}>
                <input placeholder="商品名称" />
                <input placeholder="销售员" />
                <input placeholder="地区" />
              </div>
            </>
          )}
          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={() => setShowMore(!showMore)}>
              {showMore ? '隐藏高级' : '更多条件'}
            </Button>
            <Button type="submit">查询</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
