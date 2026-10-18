/** @type {import('next').NextConfig} */
export default {webpack:(c)=>{c.resolve.alias.canvas=false;return c}};
