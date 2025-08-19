import React from "react";
import { render } from "@testing-library/react";
import DashboardPage from "./page";
import Providers from "../../providers";

describe("DashboardPage", () => {
  it("renders dashboard without crashing", () => {
    render(
      <Providers>
        <DashboardPage />
      </Providers>
    );
  });
});


