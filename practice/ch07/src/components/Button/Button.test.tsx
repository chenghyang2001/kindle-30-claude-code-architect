import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("能渲染 children", () => {
    render(<Button>hello</Button>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});
