import { useMemo, useState } from "react";
import messyReports from "../fixtures/phase-0/messy-reports.json";
import { EmptyState } from "../components/EmptyState";
import { Phase0RawInfoPanel } from "../features/phase-0/Phase0RawInfoPanel";
import { Phase0Workbench } from "../features/phase-0/Phase0Workbench";
import type { Phase0MessyRecord } from "../features/phase-0/phase0-types";

type TabKey = "raw" | "workbench" | "classification";
type EventType =
  "淹水" | "交通阻塞" | "房屋受損" | "人員受困" | "物資短缺" | "其他";
type ServiceType =
  | "醫療"
  | "食物／飲水"
  | "物資"
  | "挖土／清障"
  | "運送"
  | "安置"
  | "通訊"
  | "其他";
type ReviewState =
  "待分類" | "已分類" | "需要人工確認" | "不能直接當作已確認事實";
type DispatchReadiness = "不可派工" | "待補資料" | "分類草稿";

type MessageItem = {
  id: string;
  content: string;
  source: string;
  verificationStatus: string;
  eventType: EventType;
  serviceType: ServiceType;
  reviewState: ReviewState;
  dispatchReadiness: DispatchReadiness;
  reviewNotes: string[];
};

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "raw", label: "原始資訊" },
  { key: "workbench", label: "整理工作台" },
  { key: "classification", label: "訊息分類" },
];

const phase0Records = messyReports satisfies Phase0MessyRecord[];

function inferServiceType(content: string): ServiceType {
  const normalized = content.toLowerCase();

  if (/清泥|挖土|清障|泥水|淤泥|整理土/.test(normalized)) {
    return "挖土／清障";
  }

  if (/醫療|藥|診所|傷|急診|醫/.test(normalized)) {
    return "醫療";
  }

  if (/雨鞋|衣物|物資|帳篷|備品|工具|毛毯|睡袋|盥洗|器材/.test(normalized)) {
    return "物資";
  }

  if (/安置|住|集合點|住宿|收容/.test(normalized)) {
    return "安置";
  }

  if (/通訊|電話|訊息|網路|手機/.test(normalized)) {
    return "通訊";
  }

  if (/交通|接送|運送|車|路|道路|封閉/.test(normalized)) {
    return "運送";
  }

  if (/水電|電力|檢修|房屋|屋頂|屋況/.test(normalized)) {
    return "其他";
  }

  if (/食物|飲用水|飲水|糧|餐|泡麵|乾糧|熱食/.test(normalized)) {
    return "食物／飲水";
  }

  return "其他";
}

function inferEventType(content: string): EventType {
  if (/淹水|泥水|淤泥/.test(content)) {
    return "淹水";
  }

  if (/道路|封閉|交通|接送|車站|入口/.test(content)) {
    return "交通阻塞";
  }

  if (/屋|住家|家具|房屋/.test(content)) {
    return "房屋受損";
  }

  if (/受困|親友|長者|藥品/.test(content)) {
    return "人員受困";
  }

  if (/缺|雨鞋|衣物|物資|飲用水|食物/.test(content)) {
    return "物資短缺";
  }

  return "其他";
}

function inferReviewState(record: Phase0MessyRecord): ReviewState {
  if (record.verificationStatus === "unverified") {
    return "不能直接當作已確認事實";
  }

  if (
    /不知道|不確定|疑似|尚未|未確認|沒有說|無法確認|不是官方|昨天|沒更新|代|家屬|群組|有人說|截圖|留言/.test(
      record.rawText,
    )
  ) {
    return "不能直接當作已確認事實";
  }

  return "需要人工確認";
}

function buildReviewNotes(record: Phase0MessyRecord): string[] {
  const notes = [
    `原始查核狀態是 ${record.verificationStatus}，不是已確認資料。`,
  ];

  if (/不知道|不確定|疑似|尚未|未確認|沒有說|無法確認/.test(record.rawText)) {
    notes.push("原文直接提到仍有不確定或尚未確認的資訊。");
  }

  if (/有人說|群組|留言|截圖|家屬|代/.test(record.rawText)) {
    notes.push("來源或轉述鏈需要人工追問，不能直接當作當事人確認。");
  }

  if (
    /地址只有|位置在|完整地址|哪一天|官方公告|道路危險|任務已完成/.test(
      record.rawText,
    )
  ) {
    notes.push("缺少可派工所需的時間、地點、同意或現場條件。");
  }

  if (notes.length === 1) {
    notes.push("分類只是文字規則產生的草稿，仍需人類檢查原文。");
  }

  return notes;
}

function inferDispatchReadiness(reviewState: ReviewState): DispatchReadiness {
  if (reviewState === "不能直接當作已確認事實") {
    return "不可派工";
  }

  if (reviewState === "需要人工確認" || reviewState === "待分類") {
    return "待補資料";
  }

  return "分類草稿";
}

const initialMessages: MessageItem[] = phase0Records.map((record) => {
  const reviewState = inferReviewState(record);

  return {
    id: record.id,
    content: record.rawText,
    source: record.sourceType,
    verificationStatus: record.verificationStatus,
    eventType: inferEventType(record.rawText),
    serviceType: inferServiceType(record.rawText),
    reviewState,
    dispatchReadiness: inferDispatchReadiness(reviewState),
    reviewNotes: buildReviewNotes(record),
  };
});

export function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("raw");
  const [selectedRecordId, setSelectedRecordId] = useState(
    phase0Records[0]?.id ?? "",
  );
  const [messages, setMessages] = useState(initialMessages);

  function selectForWorkbench(recordId: string) {
    setSelectedRecordId(recordId);
    setActiveTab("workbench");
  }

  function updateMessageClassification(
    messageId: string,
    updates: Partial<MessageItem>,
  ) {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? { ...message, ...updates } : message,
      ),
    );
  }

  function updateMessageReviewState(
    messageId: string,
    reviewState: ReviewState,
  ) {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? {
              ...message,
              reviewState,
              dispatchReadiness: inferDispatchReadiness(reviewState),
            }
          : message,
      ),
    );
  }

  const reviewSummary = useMemo(() => {
    return ["待分類", "已分類", "需要人工確認", "不能直接當作已確認事實"].map(
      (state) => ({
        state,
        count: messages.filter((message) => message.reviewState === state)
          .length,
      }),
    );
  }, [messages]);

  const groupedMessages = useMemo(() => {
    return (
      [
        "醫療",
        "食物／飲水",
        "物資",
        "挖土／清障",
        "運送",
        "安置",
        "通訊",
        "其他",
      ] as ServiceType[]
    ).map((serviceType) => ({
      serviceType,
      items: messages.filter((message) => message.serviceType === serviceType),
    }));
  }, [messages]);

  return (
    <main className="layout">
      <header className="hero">
        <p className="eyebrow">SITCON Camp 2026</p>
        <h1>災害資訊整理工作台</h1>
        <p>
          第一階段先用 coding agent
          做出可展示的前端原型，再從成果中看見資料品質、角色、狀態與來源的限制。
        </p>
      </header>

      <nav className="tabs" aria-label="第一階段工作區">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? "active" : ""}
            type="button"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="panel">
        {phase0Records.length === 0 ? (
          <EmptyState message="目前沒有資料" />
        ) : activeTab === "raw" ? (
          <Phase0RawInfoPanel
            records={phase0Records}
            selectedRecordId={selectedRecordId}
            onSelect={selectForWorkbench}
          />
        ) : activeTab === "workbench" ? (
          <Phase0Workbench
            records={phase0Records}
            selectedRecordId={selectedRecordId}
            onSelect={setSelectedRecordId}
          />
        ) : (
          <div className="classification-board">
            <div className="classification-board__intro">
              <p className="eyebrow">訊息分類工作台</p>
              <h2>把零散的災害訊息整理成可分派、可處理的資訊。</h2>
              <p>
                這裡先把每筆訊息標示成事件類型、需要的服務類型與派工前檢查。分類是草稿，不代表資料已確認，也不能直接變成志工任務。
              </p>
            </div>

            <div
              className="classification-board__summary"
              aria-label="分類統計"
            >
              {reviewSummary.map((item) => (
                <div key={item.state} className="classification-summary-card">
                  <span>{item.state}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>

            <div className="classification-board__list">
              {groupedMessages.map((group) => (
                <section key={group.serviceType} className="service-group">
                  <div className="service-group__header">
                    <h3>{group.serviceType}</h3>
                    <span>{group.items.length} 筆</span>
                  </div>

                  {group.items.map((message) => (
                    <article key={message.id} className="classification-card">
                      <div className="classification-card__header">
                        <div>
                          <h4>
                            {message.id}：{message.content}
                          </h4>
                          <p>
                            來源：{message.source} · 原始查核狀態：
                            {message.verificationStatus}
                          </p>
                        </div>
                        <span
                          className={`classification-chip classification-chip--${message.reviewState === "已分類" ? "done" : message.reviewState === "需要人工確認" ? "review" : "blocked"}`}
                        >
                          {message.reviewState}
                        </span>
                      </div>

                      <div className="classification-meta">
                        <span>事件：{message.eventType}</span>
                        <span>服務：{message.serviceType}</span>
                        <span>派工準備度：{message.dispatchReadiness}</span>
                      </div>

                      <div className="classification-review">
                        <strong>派工前要先確認</strong>
                        <ul>
                          {message.reviewNotes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="classification-card__actions">
                        <label className="classification-select">
                          <span>事件類型</span>
                          <select
                            value={message.eventType}
                            onChange={(event) =>
                              updateMessageClassification(message.id, {
                                eventType: event.target.value as EventType,
                              })
                            }
                          >
                            {(
                              [
                                "淹水",
                                "交通阻塞",
                                "房屋受損",
                                "人員受困",
                                "物資短缺",
                                "其他",
                              ] as EventType[]
                            ).map((eventType) => (
                              <option key={eventType} value={eventType}>
                                {eventType}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="classification-select">
                          <span>服務類型</span>
                          <select
                            value={message.serviceType}
                            onChange={(event) =>
                              updateMessageClassification(message.id, {
                                serviceType: event.target.value as ServiceType,
                              })
                            }
                          >
                            {(
                              [
                                "醫療",
                                "食物／飲水",
                                "物資",
                                "挖土／清障",
                                "運送",
                                "安置",
                                "通訊",
                                "其他",
                              ] as ServiceType[]
                            ).map((serviceType) => (
                              <option key={serviceType} value={serviceType}>
                                {serviceType}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="classification-select">
                          <span>狀態</span>
                          <select
                            value={message.reviewState}
                            onChange={(event) =>
                              updateMessageReviewState(
                                message.id,
                                event.target.value as ReviewState,
                              )
                            }
                          >
                            {(
                              [
                                "待分類",
                                "已分類",
                                "需要人工確認",
                                "不能直接當作已確認事實",
                              ] as ReviewState[]
                            ).map((reviewState) => (
                              <option key={reviewState} value={reviewState}>
                                {reviewState}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </article>
                  ))}
                </section>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
