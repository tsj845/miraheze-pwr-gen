This is a combination scraper and template filler that automatically populates template fields for Miraheze practice wiki request reviews.

This is intended to be hosted as a set of userspace pages, scripts, and styles.


# Usage
To use this tool, visit [this page](https://meta.miraheze.org/wiki/User:Person0192837465/pwr/gen) and follow the setup instructions.  
Alternatively, copy the contents of the following files into pages under your userspace with the same names:
```
/pwr/
- gen.wikitext
- generator.css
- generator.js
- loader.js
- template.json
```
You will need to modify the content of `gen.wikitext` to point to your own userspace pages and remove references to `guide.wikitext`, though I'd advise removing the setup instructions entirely.

# Some Notes
`/pwr/dev` is intended to be an unstable subdirectory with zero guarantees about anything, this is to allow me to stage upcoming changes there and also do active development on-wiki without potentially publishing broken code. Never use someone else's dev path unless you're giving feedback to them about an upcoming change.

