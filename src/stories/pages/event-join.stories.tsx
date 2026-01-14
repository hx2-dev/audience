import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, within, userEvent, expect } from "storybook/test";
import { EventJoinForm } from "~/components/features/event-join";

const meta = {
  title: "Pages/EventJoin",
  component: EventJoinForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
  args: {
    onJoin: fn(),
  },
} satisfies Meta<typeof EventJoinForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FillDemo: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("textbox"), "123456");
    await expect(args.onJoin).toHaveBeenCalledWith("123456");
  },
};

export const PasteDemo: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("textbox"));
    await userEvent.paste("123456");
    await expect(args.onJoin).toHaveBeenCalledWith("123456");
  },
};
