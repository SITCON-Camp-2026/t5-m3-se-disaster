import { useMemo, useState } from "react";
import messyReports from "../fixtures/phase-0/messy-reports.json";
import { EmptyState } from "../components/EmptyState";
import { Phase0RawInfoPanel } from "../features/phase-0/Phase0RawInfoPanel";
import { Phase0Workbench } from "../features/phase-0/Phase0Workbench";
import type { Phase0MessyRecord } from "../features/phase-0/phase0-types";

type TabKey = "raw" | "workbench" | "classification";
type EventType =
  | "淹水"
  | "交通阻塞"
  | "房屋受損"
  | "人員受困"
  | "物資短缺"
  | "其他";
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
  | "待分類"
  | "已分類"
  | "需要人工確認"
  | "不能直接當作已確認事實";
type DispatchReadiness =
  | "不可派工"
  | "待補資料"
  | "分類草稿"
  | "待人類調度者確認";
type SourceRisk = "轉發或二手來源" | "來源仍待確認" | "需核對查核狀態";
type WorkforceNeed =
  | "清理泥沙"
  | "搬運物資"
  | "醫療協助"
  | "交通接送"
  | "物資整理"
  | "聯絡確認";
type SupplyNeed =
  | "飲食物資"
  | "衣物用品"
  | "清潔用品"
  | "醫療用品"
  | "住宿用品"
  | "工具器材"
  | "通訊與電力"
  | "搬運與交通用品";

type MessageItem = {
  id: string;
  content: string;
  source: string;
  verificationStatus: string;
  eventType: EventType;
  serviceTypes: ServiceType[];
  reviewState: ReviewState;
  dispatchReadiness: DispatchReadiness;
  sourceRisk: SourceRisk;
  reviewNotes: string[];
};

type V1Draft = {
  record: Phase0MessyRecord;
  shortSummary: string;
  summaryChart: ReportSummaryChartItem[];
  helpTypes: ServiceType[];
  sourceChecks: string[];
  missingFields: string[];
  workforceNeeds: WorkforceNeed[];
  supplyNeeds: SupplyNeed[];
  readiness: DispatchReadiness;
  decisionLog: string;
  comments: string[];
};

type ReportSummaryChartItem = {
  label: string;
  value: string;
  note: string;
};

type V1NeedsFilter = "全部" | "來源待確認" | "待補資料";
type V1HelpFilter = "全部" | ServiceType;

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "raw", label: "原始資訊" },
  { key: "workbench", label: "整理工作台" },
  { key: "classification", label: "訊息分類" },
];

const phase0Records = messyReports satisfies Phase0MessyRecord[];
const serviceTypes = [
  "醫療",
  "食物／飲水",
  "物資",
  "挖土／清障",
  "運送",
  "安置",
  "通訊",
  "其他",
] as const satisfies readonly ServiceType[];

const quickReportPhrases = [
  "我只知道大概位置",
  "時間不確定",
  "我是轉述別人的訊息",
  "需要清理泥沙",
  "需要藥品協助",
  "需要手套或雨鞋",
  "先不要直接派人",
];

function getServiceGroupClass(serviceType: ServiceType): string {
  switch (serviceType) {
    case "醫療":
      return "medical";
    case "食物／飲水":
      return "food";
    case "物資":
      return "materials";
    case "挖土／清障":
      return "debris";
    case "運送":
      return "transport";
    case "安置":
      return "shelter";
    case "通訊":
      return "communication";
    default:
      return "other";
  }
}

function inferServiceTypes(content: string): ServiceType[] {
  const normalized = content.toLowerCase();
  const inferred = new Set<ServiceType>();

  if (/清泥|挖土|清障|泥水|淤泥|整理土/.test(normalized)) {
    inferred.add("挖土／清障");
  }

  if (/醫療|藥|診所|傷|急診|醫/.test(normalized)) {
    inferred.add("醫療");
  }

  if (/雨鞋|衣物|物資|帳篷|備品|工具|毛毯|睡袋|盥洗|器材/.test(normalized)) {
    inferred.add("物資");
  }

  if (/安置|住|集合點|住宿|收容/.test(normalized)) {
    inferred.add("安置");
  }

  if (/通訊|電話|訊息|網路|手機/.test(normalized)) {
    inferred.add("通訊");
  }

  if (/交通|接送|運送|車|道路|封閉/.test(normalized)) {
    inferred.add("運送");
  }

  if (/水電|電力|檢修|房屋|屋頂|屋況/.test(normalized)) {
    inferred.add("其他");
  }

  if (
    /食物|飲用水|飲水|糧|餐|泡麵|乾糧|熱食/.test(normalized) &&
    !/飲用水暫時不缺|飲水暫時不缺|不缺[^。；，]*飲用水|不缺[^。；，]*飲水/.test(
      normalized,
    )
  ) {
    inferred.add("食物／飲水");
  }

  return inferred.size > 0 ? [...inferred] : ["其他"];
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

function inferV1Readiness(reviewState: ReviewState): DispatchReadiness {
  if (reviewState === "不能直接當作已確認事實") {
    return "不可派工";
  }

  return "待人類調度者確認";
}

function inferSourceRisk(record: Phase0MessyRecord): SourceRisk {
  if (/有人說|群組|留言|截圖|家屬|來電/.test(record.rawText)) {
    return "轉發或二手來源";
  }

  if (record.sourceType === "social_post") {
    return "來源仍待確認";
  }

  return "需核對查核狀態";
}

function inferWorkforceNeeds(content: string): WorkforceNeed[] {
  const needs = new Set<WorkforceNeed>();

  if (/清泥|清淤|泥水|淤泥/.test(content)) {
    needs.add("清理泥沙");
  }

  if (/搬|家具|物資|雨鞋|衣物/.test(content)) {
    needs.add("搬運物資");
    needs.add("物資整理");
  }

  if (/醫療|藥|診所|傷|急診|醫/.test(content)) {
    needs.add("醫療協助");
  }

  if (/交通|接送|道路|車站|入口|封閉/.test(content)) {
    needs.add("交通接送");
  }

  if (/確認|聯絡|來電|家屬|親友|轉述|不確定/.test(content)) {
    needs.add("聯絡確認");
  }

  return [...needs];
}

function inferSupplyNeeds(content: string): SupplyNeed[] {
  const needs = new Set<SupplyNeed>();

  if (/飲用水|飲水|食物|乾糧|便當|嬰兒食品|特殊飲食/.test(content)) {
    needs.add("飲食物資");
  }

  if (/衣物|雨衣|雨鞋|襪子|毛巾/.test(content)) {
    needs.add("衣物用品");
  }

  if (/垃圾袋|手套|掃把|拖把|消毒|清潔/.test(content)) {
    needs.add("清潔用品");
  }

  if (/藥|急救|口罩|酒精|紗布|醫療/.test(content)) {
    needs.add("醫療用品");
  }

  if (/棉被|睡袋|床墊|帳篷|盥洗|住宿|安置/.test(content)) {
    needs.add("住宿用品");
  }

  if (/鏟子|畚箕|水桶|手電筒|延長線|發電機|水電|工具/.test(content)) {
    needs.add("工具器材");
  }

  if (/行動電源|充電|對講機|電池|通訊|電力/.test(content)) {
    needs.add("通訊與電力");
  }

  if (/紙箱|推車|繩索|膠帶|油料|搬運|交通/.test(content)) {
    needs.add("搬運與交通用品");
  }

  return [...needs];
}

function buildMissingFields(record: Phase0MessyRecord): string[] {
  const missing = new Set<string>();
  const text = record.rawText;

  if (/地址只有|位置在|附近|那邊|老雜貨店後面|第二排住家/.test(text)) {
    missing.add("缺明確地點");
  }

  if (/不知道|哪一天|昨天|沒更新|不確定|尚未|時間/.test(text)) {
    missing.add("缺時間有效性");
  }

  if (/有人說|群組|留言|截圖|家屬|代/.test(text)) {
    missing.add("缺第一手來源");
  }

  if (/同意|公開完整地址|長者|親友/.test(text)) {
    missing.add("缺當事人同意");
  }

  if (/道路危險|淹水|現場|不適合|無法確認/.test(text)) {
    missing.add("現場狀況不明");
  }

  if (missing.size === 0) {
    missing.add("人工覆核紀錄");
  }

  return [...missing];
}

function buildShortSummary(record: Phase0MessyRecord): string {
  const needs = [
    ...inferWorkforceNeeds(record.rawText),
    ...inferSupplyNeeds(record.rawText),
  ].slice(0, 2);
  const label = needs.length > 0 ? needs.join(" / ") : inferEventType(record.rawText);
  const sourceStatus =
    inferSourceRisk(record) === "需核對查核狀態"
      ? "待人工確認"
      : "來源待確認";

  return `${label}｜${sourceStatus}`;
}

function inferPersonText(record: Phase0MessyRecord): string {
  const text = record.rawText;

  if (/長者/.test(text)) {
    return "長者或其轉述者";
  }

  if (/家屬|親友/.test(text)) {
    return "外地家屬或親友";
  }

  if (/志工/.test(text)) {
    return "現場志工";
  }

  if (/有人說|群組|社群|留言|截圖/.test(text)) {
    return "轉發者或社群來源";
  }

  return "需要人工確認";
}

function inferTimeText(record: Phase0MessyRecord): string {
  const explicitTime = record.rawText.match(/\d{1,2}:\d{2}/)?.[0];

  if (explicitTime) {
    return `${explicitTime}，仍需確認是否為事件時間`;
  }

  if (/中午前|早上|下午|昨天|今天/.test(record.rawText)) {
    return "原文有相對時間，需要確認日期";
  }

  return "需要人工確認";
}

function inferPlaceText(record: Phase0MessyRecord): string {
  const text = record.rawText;

  if (/光復車站東側出口/.test(text)) {
    return "光復車站東側出口";
  }

  if (/光復車站/.test(text)) {
    return "光復車站附近，需確認精確位置";
  }

  if (/溪畔活動中心/.test(text)) {
    return "溪畔活動中心";
  }

  if (/大進路口/.test(text)) {
    return "大進路口附近，需確認精確位置";
  }

  if (/老街|學校側門|A 區|臨時點/.test(text)) {
    return "原文有概略地點，需要人工確認";
  }

  return "需要人工確認";
}

function inferThingsToBring(record: Phase0MessyRecord): string {
  const items = new Set<string>();
  const text = record.rawText;

  if (/手套/.test(text)) items.add("手套");
  if (/雨鞋/.test(text)) items.add("雨鞋");
  if (/鏟子/.test(text)) items.add("鏟子");
  if (/藥|藥品/.test(text)) items.add("藥品");
  if (/飲用水|飲水/.test(text) && !/不缺/.test(text)) items.add("飲用水");
  if (/水電/.test(text)) items.add("水電檢修工具");
  if (/清泥|清淤|泥水|淤泥/.test(text)) items.add("清理泥沙工具");
  if (/家具|搬動/.test(text)) items.add("搬運工具");

  return items.size > 0 ? [...items].join("、") : "需要人工確認";
}

function buildSummaryChart(
  record: Phase0MessyRecord,
  workforceNeeds: WorkforceNeed[],
  supplyNeeds: SupplyNeed[],
): ReportSummaryChartItem[] {
  const thingText = inferThingsToBring(record);
  const needsText = [...workforceNeeds, ...supplyNeeds].join("、");

  return [
    {
      label: "人",
      value: inferPersonText(record),
      note: "誰回報或與事件有關",
    },
    {
      label: "事",
      value: needsText || inferEventType(record.rawText),
      note: "目前只能當整理草稿",
    },
    {
      label: "時",
      value: inferTimeText(record),
      note: "時間不明時不可直接派工",
    },
    {
      label: "地",
      value: inferPlaceText(record),
      note: "地點需能被人類確認",
    },
    {
      label: "需要帶的東西",
      value: thingText,
      note: "物資與工具仍需人工確認",
    },
    {
      label: "下一步",
      value:
        record.verificationStatus === "unverified"
          ? "先補來源與時間"
          : "整理後交給人類確認",
      note: "AI 不決定是否派人",
    },
  ];
}

function buildSourceChecks(record: Phase0MessyRecord): string[] {
  const checks = ["核對原始查核狀態", "保留原文，不改寫成事實"];

  if (record.sourceType === "social_post" || /截圖|群組|有人說|留言/.test(record.rawText)) {
    checks.push("追問原始連結");
    checks.push("確認發文時間");
    checks.push("確認發文者是否第一手");
    checks.push("判斷是否可能是舊消息");
  }

  if (/家屬|來電|代/.test(record.rawText)) {
    checks.push("確認轉述者和事件關係");
  }

  return checks;
}

function buildV1Draft(record: Phase0MessyRecord): V1Draft {
  const reviewState = inferReviewState(record);
  const workforceNeeds = inferWorkforceNeeds(record.rawText);
  const supplyNeeds = inferSupplyNeeds(record.rawText);

  return {
    record,
    shortSummary: buildShortSummary(record),
    summaryChart: buildSummaryChart(record, workforceNeeds, supplyNeeds),
    helpTypes: inferServiceTypes(record.rawText),
    sourceChecks: buildSourceChecks(record),
    missingFields: buildMissingFields(record),
    workforceNeeds,
    supplyNeeds,
    readiness: inferV1Readiness(reviewState),
    decisionLog:
      reviewState === "不能直接當作已確認事實"
        ? "保留為待補資料，原因需由資訊整理者人工確認。"
        : "可形成候選整理結果，但仍只供人類調度者確認。",
    comments: [],
  };
}

const initialMessages: MessageItem[] = phase0Records.map((record) => {
  const reviewState = inferReviewState(record);

  return {
    id: record.id,
    content: record.rawText,
    source: record.sourceType,
    verificationStatus: record.verificationStatus,
    eventType: inferEventType(record.rawText),
    serviceTypes: inferServiceTypes(record.rawText),
    reviewState,
    dispatchReadiness: inferDispatchReadiness(reviewState),
    sourceRisk: inferSourceRisk(record),
    reviewNotes: buildReviewNotes(record),
  };
});

export function App() {
  const path = globalThis.location?.pathname ?? "/";
  const isV1 = path.startsWith("/v1");

  return isV1 ? <V1Page /> : <Phase0Page />;
}

function Phase0Page() {
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

  function toggleMessageServiceType(messageId: string, serviceType: ServiceType) {
    setMessages((current) =>
      current.map((message) => {
        if (message.id !== messageId) {
          return message;
        }

        const hasServiceType = message.serviceTypes.includes(serviceType);
        const nextServiceTypes = hasServiceType
          ? message.serviceTypes.filter((item) => item !== serviceType)
          : [...message.serviceTypes, serviceType];

        return {
          ...message,
          serviceTypes: nextServiceTypes.length > 0 ? nextServiceTypes : ["其他"],
        };
      }),
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
    return serviceTypes.map((serviceType) => ({
      serviceType,
      items: messages.filter((message) =>
        message.serviceTypes.includes(serviceType),
      ),
    }));
  }, [messages]);

  const renderedMessageIds = new Set<string>();

  return (
    <main className="layout">
      <header className="hero">
        <div>
          <p className="eyebrow">SITCON Camp 2026</p>
          <h1>災害資訊整理工作台</h1>
          <p>
            第一階段先用 coding agent
            做出可展示的前端原型，再從成果中看見資料品質、角色、狀態與來源的限制。
          </p>
        </div>
        <a className="hero__link" href="/v1/">
          進入 v1 整理後台
        </a>
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
          <ClassificationBoard
            groupedMessages={groupedMessages}
            messages={messages}
            renderedMessageIds={renderedMessageIds}
            reviewSummary={reviewSummary}
            onUpdateClassification={updateMessageClassification}
            onUpdateReviewState={updateMessageReviewState}
            onToggleServiceType={toggleMessageServiceType}
          />
        )}
      </section>
    </main>
  );
}

type ClassificationBoardProps = {
  groupedMessages: Array<{ serviceType: ServiceType; items: MessageItem[] }>;
  messages: MessageItem[];
  renderedMessageIds: Set<string>;
  reviewSummary: Array<{ state: string; count: number }>;
  onUpdateClassification: (
    messageId: string,
    updates: Partial<MessageItem>,
  ) => void;
  onUpdateReviewState: (messageId: string, reviewState: ReviewState) => void;
  onToggleServiceType: (messageId: string, serviceType: ServiceType) => void;
};

function ClassificationBoard({
  groupedMessages,
  renderedMessageIds,
  reviewSummary,
  onUpdateClassification,
  onUpdateReviewState,
  onToggleServiceType,
}: ClassificationBoardProps) {
  return (
    <div className="classification-board">
      <div className="classification-board__intro">
        <p className="eyebrow">訊息分類工作台</p>
        <h2>把零散的災害訊息整理成可分派、可處理的資訊。</h2>
        <p>
          這裡先把每筆訊息標示成事件類型、多個可能的服務輸出與派工前檢查。分類是草稿，不代表資料已確認，也不能直接變成志工任務。
        </p>
      </div>

      <div className="classification-board__summary" aria-label="分類統計">
        {reviewSummary.map((item) => (
          <div key={item.state} className="classification-summary-card">
            <span>{item.state}</span>
            <strong>{item.count}</strong>
          </div>
        ))}
      </div>

      <div className="classification-board__list">
        {groupedMessages.map((group) => (
          <section
            key={group.serviceType}
            className={`service-group service-group--${getServiceGroupClass(group.serviceType)}`}
          >
            <div className="service-group__header">
              <h3>{group.serviceType}</h3>
              <span>{group.items.length} 筆</span>
            </div>

            {group.items.map((message) => {
              const isPrimaryCard = !renderedMessageIds.has(message.id);
              if (isPrimaryCard) {
                renderedMessageIds.add(message.id);
              }

              return (
                <article
                  key={`${group.serviceType}-${message.id}`}
                  className="classification-card"
                >
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
                    {isPrimaryCard ? (
                      <span
                        className={`classification-chip classification-chip--${
                          message.reviewState === "需要人工確認"
                            ? "review"
                            : message.reviewState === "待分類"
                              ? "pending"
                              : message.reviewState === "已分類"
                                ? "done"
                                : "blocked"
                        }`}
                      >
                        {message.reviewState}
                      </span>
                    ) : (
                      <span className="classification-chip classification-chip--duplicate">
                        同一訊息
                      </span>
                    )}
                  </div>

                  <div className="classification-meta">
                    <span>{`事件：${message.eventType}`}</span>
                    <span>{`服務輸出：${message.serviceTypes.join("、")}`}</span>
                    <span>{`派工準備度：${message.dispatchReadiness}`}</span>
                    <span>{`來源判讀：${message.sourceRisk}`}</span>
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
                          onUpdateClassification(message.id, {
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

                    <fieldset className="classification-service-options">
                      <legend>服務輸出</legend>
                      {serviceTypes.map((serviceType) => (
                        <label key={serviceType}>
                          <input
                            type="checkbox"
                            checked={message.serviceTypes.includes(serviceType)}
                            onChange={() =>
                              onToggleServiceType(message.id, serviceType)
                            }
                          />
                          <span>{serviceType}</span>
                        </label>
                      ))}
                    </fieldset>

                    <label className="classification-select">
                      <span>狀態</span>
                      <select
                        value={message.reviewState}
                        onChange={(event) =>
                          onUpdateReviewState(
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
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}

function V1Page() {
  const [drafts, setDrafts] = useState(() => phase0Records.map(buildV1Draft));
  const [selectedId, setSelectedId] = useState(drafts[0]?.record.id ?? "");
  const [newReportText, setNewReportText] = useState("");
  const [needsFilter, setNeedsFilter] = useState<V1NeedsFilter>("全部");
  const [helpFilter, setHelpFilter] = useState<V1HelpFilter>("全部");
  const filteredDrafts = drafts.filter((draft) => {
    const matchesNeeds =
      needsFilter === "全部" ||
      (needsFilter === "來源待確認" && draft.sourceChecks.length > 2) ||
      (needsFilter === "待補資料" &&
        draft.readiness !== "待人類調度者確認");
    const matchesHelp =
      helpFilter === "全部" || draft.helpTypes.includes(helpFilter);

    return matchesNeeds && matchesHelp;
  });
  const selectedDraft =
    filteredDrafts.find((draft) => draft.record.id === selectedId) ??
    filteredDrafts[0];

  const summary = [
    {
      label: "原始資訊",
      value: drafts.length,
      note: "仍來自 Phase 0 未整理資料",
    },
    {
      label: "來源待確認",
      value: drafts.filter((draft) => draft.sourceChecks.length > 2).length,
      note: "轉發、截圖或二手來源",
    },
    {
      label: "待補資料",
      value: drafts.filter((draft) => draft.readiness !== "待人類調度者確認")
        .length,
      note: "不能直接派工",
    },
    {
      label: "候選草稿",
      value: drafts.filter((draft) => draft.readiness === "待人類調度者確認")
        .length,
      note: "仍需人類確認",
    },
  ];
  const needsFilters: Array<{ key: V1NeedsFilter; label: string; count: number }> = [
    { key: "全部", label: "全部通報", count: drafts.length },
    {
      key: "來源待確認",
      label: "來源待確認",
      count: drafts.filter((draft) => draft.sourceChecks.length > 2).length,
    },
    {
      key: "待補資料",
      label: "待補資料",
      count: drafts.filter((draft) => draft.readiness !== "待人類調度者確認")
        .length,
    },
  ];
  const helpFilters: Array<{ key: V1HelpFilter; label: string; count: number }> =
    [
      { key: "全部", label: "全部幫助", count: drafts.length },
      ...serviceTypes.map((serviceType) => ({
        key: serviceType,
        label: serviceType,
        count: drafts.filter((draft) => draft.helpTypes.includes(serviceType))
          .length,
      })),
    ];

  function addReport() {
    const trimmedText = newReportText.trim();
    if (!trimmedText) {
      return;
    }

    const nextId = `U-${String(
      drafts.filter((draft) => draft.record.id.startsWith("U-")).length + 1,
    ).padStart(3, "0")}`;
    const record: Phase0MessyRecord = {
      id: nextId,
      rawText: trimmedText,
      sourceType: "manual_input",
      verificationStatus: "needs_review",
      updatedAt: "前端暫存，尚未確認",
    };
    const nextDraft = buildV1Draft(record);

    setDrafts((current) => [nextDraft, ...current]);
    setSelectedId(nextId);
    setNewReportText("");
    setNeedsFilter("全部");
    setHelpFilter("全部");
  }

  function appendReportPhrase(phrase: string) {
    setNewReportText((current) =>
      current.trim().length > 0 ? `${current.trim()}；${phrase}` : phrase,
    );
  }

  function addComment(recordId: string, comment: string) {
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      return;
    }

    setDrafts((current) =>
      current.map((draft) =>
        draft.record.id === recordId
          ? {
              ...draft,
              comments: [...draft.comments, trimmedComment],
            }
          : draft,
      ),
    );
  }

  return (
    <main className="layout v1-layout">
      <header className="v1-hero">
        <div>
          <p className="eyebrow">v1 資訊整理後台</p>
          <h1>調度前資料整理台</h1>
          <p>
            這個頁面把 Phase 0 原始資訊整理成來源檢查、缺漏欄位、人力與物資需求草稿。它不產生已確認派工，也不替人類決定要派誰或派多少人。
          </p>
        </div>
        <a className="hero__link hero__link--secondary" href="/">
          回到 Phase 0
        </a>
      </header>

      <section className="v1-warning" aria-label="安全邊界">
        <strong>安全邊界</strong>
        <span>
          資料仍來自 Phase 0 原始資訊；未確認內容不得顯示為已確認。使用者不必一次填完整，知道多少先留多少。
        </span>
      </section>

      <section className="v1-summary" aria-label="整理摘要">
        {summary.map((item) => (
          <div key={item.label} className="v1-summary-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.note}</small>
          </div>
        ))}
      </section>

      <section className="v1-flow" aria-label="整理流程">
        {[
          "保留原文",
          "檢查來源",
          "標記缺漏",
          "建立需求草稿",
          "交給人類確認",
        ].map((step, index) => (
          <div key={step} className="v1-flow-step">
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </section>

      <section className="v1-report-form" aria-label="新增通報">
        <div>
          <p className="eyebrow">新增通報</p>
          <h2>不用完整，也可以先留下線索</h2>
          <p>
            新增內容只會暫存在目前畫面，預設為需要人工確認，不會寫入資料檔，也不會變成已確認任務。
          </p>
        </div>
        <div className="v1-report-input">
          <label>
            <span>通報內容</span>
            <textarea
              value={newReportText}
              onChange={(event) => setNewReportText(event.target.value)}
              placeholder="貼上原始通報、轉發貼文大意或需要補查的資訊"
              rows={4}
            />
          </label>
          <div className="v1-quick-phrases" aria-label="快速補充片語">
            {quickReportPhrases.map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => appendReportPhrase(phrase)}
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
        <div className="v1-report-submit">
          <button type="button" onClick={addReport}>
            加入待整理
          </button>
          <small>送出後仍是待確認草稿。</small>
        </div>
      </section>

      <section className="v1-board">
        <aside className="v1-sidebar">
          <div className="v1-filter">
            <h2>找需要補充的通報</h2>
            <div className="v1-filter-buttons" aria-label="需要補充篩選">
              {needsFilters.map((filter) => (
                <button
                  key={filter.key}
                  className={needsFilter === filter.key ? "active" : ""}
                  type="button"
                  onClick={() => setNeedsFilter(filter.key)}
                >
                  <span>{filter.label}</span>
                  <strong>{filter.count}</strong>
                </button>
              ))}
            </div>
          </div>

          <div className="v1-filter">
            <h2>依幫助分類</h2>
            <div className="v1-help-buttons" aria-label="幫助分類篩選">
              {helpFilters.map((filter) => (
                <button
                  key={filter.key}
                  className={helpFilter === filter.key ? "active" : ""}
                  type="button"
                  onClick={() => setHelpFilter(filter.key)}
                >
                  <span>{filter.label}</span>
                  <strong>{filter.count}</strong>
                </button>
              ))}
            </div>
          </div>

          <div className="v1-queue" aria-label="原始資訊佇列">
            {filteredDrafts.map((draft) => (
              <button
                key={draft.record.id}
                className={
                  selectedDraft?.record.id === draft.record.id ? "active" : ""
                }
                type="button"
                onClick={() => setSelectedId(draft.record.id)}
              >
                <strong>{draft.record.id}</strong>
                <em>{draft.shortSummary}</em>
                <span>{draft.readiness}</span>
              </button>
            ))}
            {filteredDrafts.length === 0 ? (
              <p className="v1-empty-filter">目前沒有符合這個篩選的通報。</p>
            ) : null}
          </div>
        </aside>

        {selectedDraft ? (
          <V1DraftDetail draft={selectedDraft} onAddComment={addComment} />
        ) : null}
      </section>
    </main>
  );
}

function V1DraftDetail({
  draft,
  onAddComment,
}: {
  draft: V1Draft;
  onAddComment: (recordId: string, comment: string) => void;
}) {
  const [commentText, setCommentText] = useState("");

  function submitComment() {
    onAddComment(draft.record.id, commentText);
    setCommentText("");
  }

  function addQuickComment(comment: string) {
    onAddComment(draft.record.id, comment);
  }

  return (
    <article className="v1-detail">
      <header className="v1-detail__header">
        <div>
          <p className="eyebrow">整理草稿</p>
          <h2>{draft.record.id}</h2>
        </div>
        <span className="classification-chip classification-chip--review">
          {draft.readiness}
        </span>
      </header>

      <section className="v1-original">
        <h3>原始資訊</h3>
        <p>{draft.record.rawText}</p>
        <dl>
          <div>
            <dt>資訊取得方式</dt>
            <dd>{draft.record.sourceType}</dd>
          </div>
          <div>
            <dt>原始查核狀態</dt>
            <dd>{draft.record.verificationStatus}</dd>
          </div>
          <div>
            <dt>更新時間</dt>
            <dd>{draft.record.updatedAt}</dd>
          </div>
        </dl>
      </section>

      <section className="v1-chart" aria-label="通報統整圖表">
        <h3>通報統整圖表</h3>
        <div className="v1-chart-grid">
          {draft.summaryChart.map((item) => (
            <div key={item.label} className="v1-chart-cell">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.note}</small>
            </div>
          ))}
        </div>
      </section>

      <div className="v1-detail-grid">
        <InfoList title="來源檢查" items={draft.sourceChecks} />
        <section className="v1-info-list">
          <h3>不可派工原因</h3>
          <div className="v1-reason-tags">
            {draft.missingFields.map((field) => (
              <span key={field}>{field}</span>
            ))}
          </div>
        </section>
        <InfoList
          title="人力需求草稿"
          items={
            draft.workforceNeeds.length > 0
              ? draft.workforceNeeds
              : ["尚未整理出人力類型"]
          }
        />
        <InfoList
          title="物資需求草稿"
          items={
            draft.supplyNeeds.length > 0
              ? draft.supplyNeeds
              : ["尚未整理出物資類型"]
          }
        />
      </div>

      <section className="v1-log">
        <h3>判斷紀錄</h3>
        <p>{draft.decisionLog}</p>
      </section>

      <section className="v1-comments">
        <h3>留言與補充</h3>
        <div className="v1-quick-comments" aria-label="快速補缺漏留言">
          {draft.missingFields.map((field) => (
            <button
              key={field}
              type="button"
              onClick={() => addQuickComment(`待補：${field}`)}
            >
              待補：{field}
            </button>
          ))}
          <button
            type="button"
            onClick={() => addQuickComment("請人工確認是否仍有效")}
          >
            請人工確認是否仍有效
          </button>
        </div>
        {draft.comments.length > 0 ? (
          <ul>
            {draft.comments.map((comment, index) => (
              <li key={`${draft.record.id}-comment-${index}`}>{comment}</li>
            ))}
          </ul>
        ) : (
          <p>目前沒有補充。可以記錄缺少的來源、時間、地點或人工確認結果。</p>
        )}
        <label>
          <span>新增留言</span>
          <textarea
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="例如：缺原始連結，需追問發文時間"
            rows={3}
          />
        </label>
        <button type="button" onClick={submitComment}>
          留下補充
        </button>
      </section>
    </article>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="v1-info-list">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
