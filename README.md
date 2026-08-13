# 機械部設備管理系統

部門資產管理桌面端（1920×1080），對齊 [Figma 設計稿](https://www.figma.com/design/Wn8g8VlnMdhDbn5A9Nm9g3/cursor)。

## 啟動

```bash
cd fleet-track
npm install
npm run dev
```

瀏覽器開啟 http://localhost:3000

## 技術棧

- Next.js 16 + TypeScript + Tailwind CSS 4
- Supabase（PostgreSQL / Auth / Storage / Realtime）— 專案 `CURSOR`
- lucide-react、recharts

## 模組

| 路徑 | 說明 |
| --- | --- |
| `/` | 總覽儀表板 |
| `/machinery` | 機械設備類型 |
| `/machinery/[type]` | 類型清單（CC / RCD / OS / SC / TD / AC） |
| `/assets/[code]` | 設備詳情、引擎、配件、機鐘圖 |
| `/drilling` `/tools` `/electrical` | 鑽具 / 地盤工具 / 電器 |
| `/map` | 香港地盤資產分佈 |
| `/maintenance` | 維修報表與三步報修流程 |
| `/certificates` | 證書到期狀態 |
| `/inventory` | 零件與雜項庫存、異動日誌 |
| `/org` | 部門組織圖 |

目前畫面以 Figma 示範資料驅動，可立即操作篩選、排序、通知中心與報修流程。`.env.local` 已接上 Supabase `CURSOR` 專案；通知中心會訂閱 `notifications` 表的 Realtime INSERT。

## 後續接線

1. 在 Supabase 補齊示範資產與證書資料
2. 以 Auth + `profiles` 做 RBAC（前線 / 管理員）
3. Storage buckets：`certificates`、`machinery-photos`、`maintenance-photos`
4. Edge Function：每日午夜接續未完成維修；pg_cron 掃描證書到期
