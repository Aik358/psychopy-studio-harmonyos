import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: './dist',
			fallback: './404.html',
			precompress: false,
			strict: true
		}),
		paths: {
			base: process.env.BASE_PATH,
			relative: true
		}
	}
};

export const prerender = true;
export default config;