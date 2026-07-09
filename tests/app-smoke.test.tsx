import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/app/App";

describe("App", () => {
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
    expect(within(materialsSection as HTMLElement).getAllByText(/雨鞋/).length).toBeGreaterThan(0);
  });

  it("keeps non-food information out of the food and water bucket", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "訊息分類" }));

    const foodSection = screen
      .getByRole("heading", { name: "食物／飲水" })
      .closest("section");

    expect(foodSection).not.toBeNull();
    expect(within(foodSection as HTMLElement).queryByText(/水電檢修/)).not.toBeInTheDocument();
  });

  it("offers a message classification workspace for uncategorized items", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "訊息分類" }));

    expect(screen.getByText("訊息分類工作台")).toBeInTheDocument();
    expect(screen.getAllByText("不能直接當作已確認事實").length).toBeGreaterThan(0);
    expect(screen.getAllByText("派工前要先確認").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/派工準備度：不可派工/).length).toBeGreaterThan(0);
    expect(
      screen.queryByText("已分類", { selector: "span.classification-chip" }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getAllByLabelText("狀態")[0], {
      target: { value: "已分類" },
    });

    expect(screen.getAllByText("已分類").length).toBeGreaterThan(0);
    expect(screen.getByText("已分類", { selector: "span.classification-chip" })).toBeInTheDocument();
    expect(screen.getAllByText(/派工準備度：分類草稿/).length).toBeGreaterThan(0);
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
