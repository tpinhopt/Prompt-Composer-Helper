Pony-friendly Structured Prompt Composer

This Prompt Composer is a small, self-contained HTML tool that converts natural text into structured diffusion prompts with consistent tag routing.
It was built to solve a very specific problem:
Diffusion prompting is chaotic and i am not particulary good at prompting in general, let alone when this kind of module that has a kind of "strict" struture to follow. Also, because i started with Pony Difussion at a really short time ago and was having difficulties in generating something that would pass as lookable.

I built it to be used completely offline, no databases, no API callings, no bakcend's, just a simple tool to help me, and now sharing, to help anyone who is trying to start using this model or alike.

Just open index.html and use it.

What It Does:
 - Converts plain English into structured Danbooru-style tags
 - Splits per-character traits and actions deterministically
 - Routes environment, lighting, and scene tags correctly
 - Prevents duplicate atomic tags
 - Handles multi-entity clauses and binding logic
 - Works fully offline
 - The output is optimized for Pony-based SDXL workflows but remains flexible enough for other models that work alike.


Why It Exists:
 - I'm new to this type of prompting instead of doing it with natural language
 - It helps newcomers who are new to this part of the world of trying to run things locally and have no clue how to get some results.
 - Danbooru tags (never knew it was a thing)
 - A helper into seeing how the structure looks like
 - It was designed as a deterministic compiler, and not trying to guess what you mean.

How To Use:
 - Download index.html
 - Double-click it
 - Type your description
 - Copy the generated prompts into your preferred UI
 - That’s it.
You can unplug your internet and it still works.

What it contains:
 - Rating header (SFW, Suggestive, NSFW, Explicit)
 - Presetes that will let you chose the type of image you wantto create (photoreal, anime, carton, etc) it will Automatically add the tag to your prompts output boxes
 - Character selector. If a character is on the Danbooru tags reconginized by the model you can simply search for it (please bare in mind that it does not contain all characthers available, at least not for now)
 - Technical Settings:
   - Camera framing
   - Camera angle
   - Lighting
   - Time of day
   - Composition toggles
   - Style modifiers
   - LoRA trigger injection. If you use loras, or are already familiarized with it, simply paste the trigger words in the box and it will be filled in the prompt box 
   - All deterministic. No random weighting
 - Text input, at the same type you are writing in plain text (English) the mapping will be connecting your words to danbooru tags, that will fill the positive prompt output as you go as long as they are recognized.
 - Positive and Negative prompts output. Just click the copy button and paste it in your UI. All fields are editable, so if there is any mismatch, or edit you want to make, you can make it directly on the output boxex or after you paste the prompts in your UI

   Please keep in mind this is intended to be a helping tool, it won't make you create magical images right away. Also, all options available in the tool are optional, no need to select them all, you can, but not mandatory

   Just a reminder, this is a first version of this helper, so there is still a lot that can and need's to be improved, feedback is appreciated.

    License, MIT, you can use it, modify it, improve it as you like, or not.
