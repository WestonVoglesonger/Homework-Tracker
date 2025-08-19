import React from "react";
import { render } from "@testing-library/react";
import CalendarPage from "./page";
import Providers from "../../providers";

describe("CalendarPage", () => {
  it("renders calendar without crashing", () => {
    render(
      <Providers>
        <CalendarPage />
      </Providers>
    );
  });
});
