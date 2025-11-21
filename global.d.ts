// Allow importing global CSS files in TypeScript.
declare module '*.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}
