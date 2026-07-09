import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../src/app/App";

describe("App", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders starter title", () => {
    render(<App />);
    expect(screen.getByText("災害資訊整理工作台")).toBeInTheDocument();
  });

  it("keeps the home page focused on phase 0 tabs", () => {
    render(<App />);

    expect(
      screen.getByRole("button", { name: "原始資訊" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "整理工作台" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "通報" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "地點" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "志工任務" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "人員指派" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "進入 v1 整理後台" })).toHaveAttribute(
      "href",
      "/v1/",
    );
  });

  it("shows review states in the phase 0 workbench", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(
      screen.getByText(
        "第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("待人工確認").length).toBeGreaterThan(0);
    expect(screen.getAllByText("未查核").length).toBeGreaterThan(0);
  });

  it("classifies rain boots as a materials support need", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "訊息分類" }));

    const materialsSection = screen
      .getByRole("heading", { name: "物資" })
      .closest("section");

    expect(materialsSection).not.toBeNull();
    expect(
      within(materialsSection as HTMLElement).getAllByText(/雨鞋/).length,
    ).toBeGreaterThan(0);
  });

  it("keeps non-food information out of the food and water bucket", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "訊息分類" }));

    const foodSection = screen
      .getByRole("heading", { name: "食物／飲水" })
      .closest("section");

    expect(foodSection).not.toBeNull();
    expect(
      within(foodSection as HTMLElement).queryByText(/水電檢修/),
    ).not.toBeInTheDocument();
  });

  it("can output one report to multiple service groups", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "訊息分類" }));

    const materialsSection = screen
      .getByRole("heading", { name: "物資" })
      .closest("section");
    const otherSection = screen
      .getByRole("heading", { name: "其他" })
      .closest("section");
    const foodSection = screen
      .getByRole("heading", { name: "食物／飲水" })
      .closest("section");

    expect(materialsSection).not.toBeNull();
    expect(otherSection).not.toBeNull();
    expect(foodSection).not.toBeNull();
    expect(
      within(materialsSection as HTMLElement).getByText(/M-010/),
    ).toBeInTheDocument();
    expect(
      within(otherSection as HTMLElement).getByText(/M-010/),
    ).toBeInTheDocument();
    expect(
      within(foodSection as HTMLElement).queryByText(/M-010/),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(/服務輸出：物資、其他/).length).toBeGreaterThan(
      0,
    );
  });

  it("uses color-coded sections for each service type", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "訊息分類" }));

    const materialsSection = screen
      .getByRole("heading", { name: "物資" })
      .closest("section");

    expect(materialsSection).toHaveClass("service-group--materials");
  });

  it("offers a message classification workspace for uncategorized items", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "訊息分類" }));

    expect(screen.getByText("訊息分類工作台")).toBeInTheDocument();
    expect(
      screen.getAllByText("不能直接當作已確認事實").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("派工前要先確認").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/派工準備度：不可派工/).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.queryByText("已分類", { selector: "span.classification-chip" }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getAllByLabelText("狀態")[0], {
      target: { value: "已分類" },
    });

    expect(screen.getAllByText("已分類").length).toBeGreaterThan(0);
    expect(
      screen.getByText("已分類", { selector: "span.classification-chip" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/派工準備度：分類草稿/).length).toBeGreaterThan(
      0,
    );
  });

  it("renders the v1 organizer website at /v1/", () => {
    window.history.pushState({}, "", "/v1/");

    render(<App />);

    expect(screen.getByText("調度前資料整理台")).toBeInTheDocument();
    expect(
      screen.getByText(/資料仍來自 Phase 0 原始資訊/),
    ).toBeInTheDocument();
    expect(screen.getByText("來源檢查")).toBeInTheDocument();
    expect(screen.getByText("人力需求草稿")).toBeInTheDocument();
    expect(screen.getByText("物資需求草稿")).toBeInTheDocument();
    expect(screen.getByText("通報統整圖表")).toBeInTheDocument();
    expect(screen.getByText("人")).toBeInTheDocument();
    expect(screen.getByText("事")).toBeInTheDocument();
    expect(screen.getByText("時")).toBeInTheDocument();
    expect(screen.getByText("地")).toBeInTheDocument();
    expect(screen.getByText("需要帶的東西")).toBeInTheDocument();
    expect(screen.getAllByText(/M-001/).length).toBeGreaterThan(0);
    expect(screen.getByText(/清理泥沙 .* 交通接送｜來源待確認/)).toBeInTheDocument();
    expect(screen.getByText("不可派工原因")).toBeInTheDocument();
    expect(screen.getByText("缺明確地點")).toBeInTheDocument();
    expect(screen.getByText("缺第一手來源")).toBeInTheDocument();
    const needsFilters = screen.getByLabelText("需要補充篩選");
    const helpFilters = screen.getByLabelText("幫助分類篩選");

    expect(
      within(needsFilters).getByRole("button", { name: /來源待確認/ }),
    ).toBeInTheDocument();
    expect(
      within(needsFilters).getByRole("button", { name: /待補資料/ }),
    ).toBeInTheDocument();
    expect(
      within(helpFilters).getByRole("button", { name: /醫療/ }),
    ).toBeInTheDocument();
    expect(
      within(helpFilters).getByRole("button", { name: /物資/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("結束 本流程不產生已確認派工"),
    ).not.toBeInTheDocument();

    window.history.pushState({}, "", "/");
  });

  it("lets organizers add a report and comment on missing information", () => {
    window.history.pushState({}, "", "/v1/");

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "時間不確定" }));
    expect(screen.getByLabelText("通報內容")).toHaveValue("時間不確定");

    fireEvent.change(screen.getByLabelText("通報內容"), {
      target: {
        value: "時間不確定；群組轉傳：有人說臨時點需要手套，但沒有原始連結和時間。",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "加入待整理" }));

    expect(screen.getAllByText("U-001").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/來源待確認/).length).toBeGreaterThan(0);
    expect(screen.getByText(/群組轉傳/)).toBeInTheDocument();
    expect(screen.getByText("手套")).toBeInTheDocument();
    expect(screen.getByText("缺時間有效性")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "待補：缺時間有效性" }));
    expect(screen.getAllByText("待補：缺時間有效性").length).toBeGreaterThan(
      1,
    );

    fireEvent.change(screen.getByLabelText("新增留言"), {
      target: { value: "缺原始連結，先追問發文時間。" },
    });
    fireEvent.click(screen.getByRole("button", { name: "留下補充" }));

    expect(screen.getByText("缺原始連結，先追問發文時間。")).toBeInTheDocument();
  });

  it("filters v1 reports by missing source and help category buttons", () => {
    window.history.pushState({}, "", "/v1/");

    render(<App />);

    const needsFilters = screen.getByLabelText("需要補充篩選");
    fireEvent.click(
      within(needsFilters).getByRole("button", { name: /來源待確認/ }),
    );

    expect(screen.getAllByText(/來源待確認/).length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: /M-010/ }),
    ).not.toBeInTheDocument();

    const helpFilters = screen.getByLabelText("幫助分類篩選");
    fireEvent.click(within(helpFilters).getByRole("button", { name: /醫療/ }));

    expect(screen.getAllByText("M-012").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/醫療協助/).length).toBeGreaterThan(0);
  });

  it("keeps draft CRUD as learner work instead of starter output", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(screen.getByText("尚未建立整理草稿")).toBeInTheDocument();
    expect(
      screen.getByText(/請 agent 加上建立、編輯、刪除或重設整理草稿/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/已產生 \d+ 筆安全邊界草稿/),
    ).not.toBeInTheDocument();
  });
});
