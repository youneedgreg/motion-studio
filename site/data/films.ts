// What each film is, in a line. Everything else (formats, videos, checks) comes from content/films.json.
export const FILM_INFO: Record<string, { title: string; em: string; line: string; order: number }> = {
  'safarios-v2': {
    title: 'Safari OS', em: 'v2', order: 0,
    line: 'One honeymoon booking goes from a website request to fully paid, then a circle-wipe run through every other module. One timeline renders three formats.',
  },
  'florios-morph': {
    title: 'Florios', em: 'morph', order: 1,
    line: 'One container morphs through eight states of a fictional flower-export app (roles, packhouse, grading, cold room, dispatch) and loops. Every state is measured against its spec table.',
  },
  safarios: {
    title: 'Safari OS', em: 'v1', order: 2,
    line: 'The first product film. With a single reference, it copied that reference’s structure shot for shot, which became the first lesson in v2’s brief.',
  },
  reel: {
    title: 'The', em: 'showreel', order: 3,
    line: 'The studio’s first film: six bars at 96 BPM (type, shape, weight, depth, curves, name), every cut a match cut, looping.',
  },
};
