import { expect, type Page } from "@playwright/test";

const TITLE_SEEN_KEY = "case404:title-seen";

export const skipTitleCard = (page: Page) =>
  page.addInitScript((key) => window.sessionStorage.setItem(key, "1"), TITLE_SEEN_KEY);

export const disableWebGL = (page: Page) =>
  page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type.startsWith("webgl")) return null;
      return (getContext as (...args: unknown[]) => RenderingContext | null).call(this, type, ...rest);
    } as typeof getContext;
  });

export const boardLoaded = (page: Page) =>
  expect(page.locator('[role="status"][aria-hidden="true"]').first()).toBeAttached({ timeout: 300_000 });

export const loseWebGLContext = (page: Page) =>
  page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const gl = canvas?.getContext("webgl2") ?? canvas?.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(gl);
  });
