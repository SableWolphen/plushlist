(function (root) {
  const worlds = {
    soft: { "A little counts.": "Tiny steps. Big hugs.", "Your plush is happy you're here.": "A little cheer from your plush pal.", "Today": "Tiny things for today", "Habits": "Little routines", "Today's plan": "Today’s little schedule" },
    dino: {
      "A little counts.": "One tiny stomp counts.",
      "Your plush is happy you're here.": "Your plush pal is ready for a gentle adventure.",
      "One tiny thing": "One tiny stomp", "Today": "Today’s quests", "Habits": "Little stomps", "Today's plan": "Today’s trail",
      "What do you need right now?": "What does your explorer need?", "Choose what feels closest.": "Pick a cozy path through the meadow.",
      "Every return counts.": "Every little return is dino-mite.", "Your story is bigger than a streak.": "Your trail is bigger than a streak.",
      "Make room for your week.": "Make room for your next adventure.", "Welcome back.": "Welcome back, explorer.",
    },
    meadow: { "A little counts.": "Little things take root.", "Your plush is happy you're here.": "Your cozy meadow has room for you.", "One tiny thing": "One little seed", "Every return counts.": "A little growth counts.", "Welcome back.": "Welcome back to your meadow." },
    peach: { "A little counts.": "One cozy moment counts.", "Your plush is happy you're here.": "A warm little corner, at your pace.", "One tiny thing": "One cozy step", "Welcome back.": "Your cozy corner is ready." },
    pink: { "A little counts.": "A little kindness blooms.", "One tiny thing": "One little petal", "Welcome back.": "Welcome back, lovely." },
    strawberry: { "A little counts.": "One sweet little step.", "Your plush is happy you're here.": "There’s a cozy spot for you at the picnic.", "One tiny thing": "One sweet step", "Welcome back.": "Welcome back to your sweet spot." },
    "soft-light": { "A little counts.": "One light little step.", "Your plush is happy you're here.": "A little breathing room, just for you.", "One tiny thing": "One cloud-light step", "Welcome back.": "Welcome back to your soft landing." },
    twilight: { "A little counts.": "One gentle glow counts.", "Your plush is happy you're here.": "Your plush is here in the quiet.", "One tiny thing": "One little glow", "Every return counts.": "Every little glow matters.", "Welcome back.": "Your quiet corner is waiting." },
  };
  const nursery = {
    motherly: {
      "A little counts.": "Mommy’s proud, sweetheart.", "Your plush is happy you're here.": "One tiny thing when you’re ready. Mommy’s right here.",
      "One tiny thing": "One little job, sweetheart", "Today": "Your little jobs", "Habits": "Cozy routines", "Today's plan": "Our cozy day",
      "What do you need right now?": "What would feel nice, little one?", "Choose what feels closest.": "Mommy will help you choose one gentle thing.",
      "Every return counts.": "Mommy noticed your little wins.", "Your story is bigger than a streak.": "You can take your time, sweetheart.",
      "Make room for your week.": "Let’s make a cozy week, sweetheart.", "A gentle plan, with space to breathe.": "Mommy can help leave room for rest.",
      "Welcome back.": "Welcome back, little one.", "Your day, your pace. Sign in with Google or an email code.": "Mommy’s happy you’re here, sweetheart. Sign in when you’re ready.",
    },
    fatherly: {
      "A little counts.": "Daddy’s proud of you, kiddo.", "Your plush is happy you're here.": "Go slow, buddy. Daddy’s right here.",
      "One tiny thing": "One little job, kiddo", "Today": "Your little jobs", "Habits": "Cozy routines", "Today's plan": "Our cozy day",
      "What do you need right now?": "What do you need, buddy?", "Choose what feels closest.": "Daddy can help with one little thing.",
      "Every return counts.": "Atta kid! Daddy noticed.", "Your story is bigger than a streak.": "No worries, buddy. We can go at your pace.",
      "Make room for your week.": "Let’s make room for your week, kiddo.", "A gentle plan, with space to breathe.": "Daddy will help keep it gentle.",
      "Welcome back.": "Welcome back, kiddo.", "Your day, your pace. Sign in with Google or an email code.": "Daddy’s glad you’re back, buddy. Sign in when you’re ready.",
    },
  };
  function forWorld(world, voice) { return String(world).startsWith("baby") ? nursery[voice === "fatherly" ? "fatherly" : "motherly"] : worlds[world] || worlds.soft; }
  root.PlushLifeThemeCopy = { forWorld, worlds: {"soft":{"label":"Lavender","background":"#F5F0FB","surface":"#FFFFFF","ink":"#4E3A60","muted":"#705A84","accent":"#705295","surface2":"#E9DDF6","line":"#E9D6FB","companion":"lavender bear","asset":"soft"},"dino":{"label":"Dinosaur Meadow","background":"#F1F7ED","surface":"#FFFFFF","ink":"#3C513A","muted":"#53684B","accent":"#527343","surface2":"#DCECCF","line":"#D6E6C8","companion":"lavender bear","asset":"signature-dino"},"baby":{"label":"Nursery","background":"#FCF1F8","surface":"#FFFFFF","ink":"#694A68","muted":"#785675","accent":"#87558A","surface2":"#F0DCEC","line":"#F0D6EA","companion":"lavender bear","asset":"signature-nursery"},"pink":{"label":"Pink Petals","background":"#FFF2F8","surface":"#FFFFFF","ink":"#684357","muted":"#76586B","accent":"#965173","surface2":"#F5DBE9","line":"#F0D7E6","companion":"lavender bear","asset":"soft"},"meadow":{"label":"Mint Meadow","background":"#F0F8F3","surface":"#FFFFFF","ink":"#355846","muted":"#486C58","accent":"#3F7158","surface2":"#DBEEDF","line":"#D4EADD","companion":"lavender bear","asset":"soft"},"peach":{"label":"Peach Cozy","background":"#FFF5EE","surface":"#FFFFFF","ink":"#684839","muted":"#795A4C","accent":"#955737","surface2":"#F9DFCD","line":"#F4DDCC","companion":"lavender bear","asset":"soft"},"twilight":{"label":"Moonlit","background":"#26243B","surface":"#332F49","ink":"#F0E9FF","muted":"#C2B4DB","accent":"#B9A0DE","surface2":"#3E395C","line":"#564B70","companion":"lavender bear","asset":"soft"},"strawberry":{"label":"Strawberry Picnic","background":"#FFF3F2","surface":"#FFFFFF","ink":"#6E4147","muted":"#80515A","accent":"#9B4E61","surface2":"#F7DCD8","line":"#F2D5D8","companion":"lavender bear","asset":"soft"},"soft-light":{"label":"Cloud Dreams","background":"#F0F5FC","surface":"#FFFFFF","ink":"#405675","muted":"#526885","accent":"#526F9D","surface2":"#DEE9F7","line":"#D8E4F4","companion":"lavender bear","asset":"soft"},"baby-night":{"label":"Nursery Night","background":"#26243B","surface":"#332F49","ink":"#F0E9FF","muted":"#C2B4DB","accent":"#B9A0DE","surface2":"#3E395C","line":"#564B70","companion":"lavender bear","asset":"signature-nursery"}} };
  if (typeof module !== "undefined") module.exports = root.PlushLifeThemeCopy;
})(typeof window !== "undefined" ? window : globalThis);
