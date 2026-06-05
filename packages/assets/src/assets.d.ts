declare module "*.png,*.jpg,*.jpeg,*.gif,*.svg" {
  const value: import("next/image").StaticImageData;
  export default value;
}
