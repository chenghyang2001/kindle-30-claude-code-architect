import { render, screen } from "@testing-library/react";
import { {{Name}} } from "./{{Name}}";

describe("{{Name}}", () => {
  it("能渲染 children", () => {
    render(<{{Name}}>hello</{{Name}}>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});
