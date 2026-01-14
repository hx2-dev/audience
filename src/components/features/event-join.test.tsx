import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventJoinForm } from "./event-join";
import { renderWithProviders } from "~/lib/testing";

describe("EventJoinForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without exploding", () => {
    renderWithProviders(<EventJoinForm onJoin={jest.fn()} />);
  });

  it("should submit when the 6th digit is entered manually", async () => {
    const user = userEvent.setup();
    const onJoin = jest.fn();
    const screen = renderWithProviders(<EventJoinForm onJoin={onJoin} />);

    const input = screen.getByRole("textbox");

    await user.type(input, "123456");

    await waitFor(() => {
      expect(onJoin).toHaveBeenCalledWith("123456");
    });
  });

  it("should submit when a 6-digit event ID is pasted into the input", async () => {
    const user = userEvent.setup();
    const onJoin = jest.fn();
    const screen = renderWithProviders(<EventJoinForm onJoin={onJoin} />);

    const input = screen.getByRole("textbox");

    await user.click(input);
    await user.paste("123456");

    await waitFor(() => {
      expect(onJoin).toHaveBeenCalledWith("123456");
    });
  });
});
