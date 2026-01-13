import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventJoinForm } from "./event-join";
import { renderWithProviders } from "~/lib/testing";
import { mockRouter } from "~/../jest.setup";

describe("EventJoinForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without exploding", () => {
    renderWithProviders(<EventJoinForm />);
  });

  it("should submit when the 6th digit is entered manually", async () => {
    const user = userEvent.setup();
    const screen = renderWithProviders(<EventJoinForm />);

    const input = screen.getByRole("textbox");

    await user.type(input, "123456");

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/audience/123456/activity");
    });
  });

  it("should submit when a 6-digit event ID is pasted into the input", async () => {
    const user = userEvent.setup();
    const screen = renderWithProviders(<EventJoinForm />);

    const input = screen.getByRole("textbox");

    await user.click(input);
    await user.paste("123456");

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/audience/123456/activity");
    });
  });
});
