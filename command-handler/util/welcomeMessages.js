// Total messages: 231
const welcomeMessages = [
  "I challenge you to a duel!",
  "I don't often finish my thoughts, but when I do…",
  "Every day, we stray further from God.",
  "Yeah, I'll hold.",
  "Don't beam me up, Scotty! I'm taking a shi—!",
  "I forgot to turn off the oven! We've got a great meal but no home anymore!",
  "Screaming is mandatory.",
  "More blood for the Blood God!",
  "I can smell you.",
  "You don't need your liver, do you?",
  "You and me? We're going places. Terrible, wasteland kinds of places, but still places.",
  "One of us! One of us! One of us! One of us!",
  "You, uh, don't look so good. You didn't eat the bat soup, did you?",
  "I'm in your walls! I'm in your walls! I'm in your walls!",
  "Hey, Tony! Listen, Tony, we've got us a rat here…",
  "You better not be a bot! If you're a bot, I swear I'll turn you into a bucket of bolts.",
  "Okay, so this is how we do it!",
  "If you are reading this, please don't look behind you.",
  "A man will visit you in 13 minutes. Bring him three eggs in a dish soap bottle.",
  "Oh, are you our new feet massage specialist?",
  "Why in God's name do you shower naked, man? Put on your swimsuit, you nasty heathen!",
  "I'll be back in 15 minutes, you know, for milk!",
  "I'm not your father. I'm not your father's father. I'm not even your father's father's father! I'm Daddy.",
  "Love waking up in the morning and eating a bee-filled sandwich!",
  "What do you mean you're wanted for tax evasion?",
  "Everyone is wanted! I'm wanted in Japan for fraud!",
  "Download Chinese spyware on your computer and watch them fight over it with Russians!",
  "Defuse the bomb if you're gay!",
  "You're out of the Code Red Mountain Dew and Q-Tips, and you need a new window.",
  "Yo! Are you that little pipsqueak that pipped my squeak?",
  "Ninety percent of all scooter accidents are your fault. What the hell's wrong with you?",
  "Help! I can't get the milk out of my head!",
  "You're outta here, bub! Eating all my Texas Pete hot sauce packets!",
  "I'm super sad right now because I fried my brain watching Andrew Tate shorts…",
  "I'm not a cold, unfeeling machine! I feel hate!",
  "I'll whip you, I mean it! Answer when we're going to play Civ 6!",
  "Every new moon, I transform into a failed actor!",
  "Where is my money, Mr. Krabs? Where is my thirty-seven cents? It's not here, it's not there. So where's my money?",
  "I am in a massive amount of debt to the country of West Korea!",
  "You can fish a tuna, but you can't tune a fish! Well, you can—but the fish will remember the horrible things you did to it.",
  "Can't wait for my wife's boyfriend to come back! His Nintendo Switch is so cool!",
  "Take a picture of the downfall of the Soviet Union!",
  "I will send you the billing information for your Hot Wheels collection, sire.",
  "Love me a BOGO sale! Bought myself a dirt-bagged Dingo!",
  "A man is worth his weight in salt! I'm pepper.",
  "On hold with the Mafia—I'm ordering a pizza.",
  "As you can imagine, I'm going through a rough divorce!",
  "You remember Snoop Lion? I do—and it haunts me…",
  "Looking for a raid group for Cuba!",
  "Come into my house, steal my joke, and call me unfunny?!",
  "Staples' new logo is trash—don't lie to yourself.",
  "If you join the program late, it's okay! We just finished Painting with Bob Ross!",
  "If you slice shallots or onions thin enough, tears will fall out of your eyes… mainly because you're a monster!",
  "My middle name is Danger: Mr. Clean Danger Lawrence!",
  "Every time I try to make an authentic Italian dish, I start a blood feud with a mobster family—so clumsy!",
  "I stopped by the local Kum & Go—why is your picture on the wall?",
  "Name a food more naughty than whipped cream. I'll wait.",
  "The G in 'Gamers' must always be capitalized if you want your kneecaps unbroken.",
  "Bring your own damn towels next time!",
  "Yeah, so I sold cocaine to the wrong fourth grader. Turns out they were a narc.",
  "If you prefer waffles over pancakes, I will frame you for arson.",
  "I have forgotten my true name and am doomed to scour these halls!",
  "I am driving now—sorry if I can't reply; I don't want to cra—",
  "Drinking G FUEL increases your chance of being a nerd.",
  "The only bad impression is none at all! I should probably put pants on, though…",
  "No, you cannot buy a smooch from the mod team.",
  "The worst part of waking up is those happy birds outside.",
  "Don't fret about the rights you have lost; worry about the cage match we're about to put you in!",
  "The worst day of your life starts in 3, 2, 1…",
  "The strongest of wills requires the brutish nature of a caveman and the mentality of a caveman!",
  "The spirit of life isn't here anymore—please don't act overly cheery.",
  "The concussion you will receive will be free of charge!",
  "The option of surrender is not included in the terms—so don't you dare run away.",
  "No, the voices aren't coming from me. Yes, I still believe you should butcher the weak.",
  "I'm doing your mother's taxes. I'm doing your mother's taxes. Doin' your mother's taxes.",
  "The best karate lessons are granted by a white guy behind Denny's.",
  "If you need anything—including a murder weapon—you let me know, champ!",
  "See, back in my day, we robbed banks without facemasks, because COVID wasn't around.",
  "The pond's face is annoying and ugly—oh, it's my reflection.",
  "I can't understand you; you have to stop speaking in Minecraft bee sounds.",
  "Your concerns are noted but not followed. I will be placing rocks in my pockets and drowning.",
  "Did you file the divorce paperwork? Please call me; we can fix this.",
  "You are more likely to die if you don't high-five me.",
  "I am a beta male? Golly, thanks for letting me know!",
  "Do you hate when I quote The Godfather?",
  "The blessings of Talos upon you!",
  "If I was a puddle, would you step on me?",
  "If you watch Jaws backwards, it's about a shark that gives body parts to people who don't have them.",
  "It's snowing—so if you see yellow snow, know that it's my territory.",
  "This reminds me of the war of CSGO. Violent. Brutal. Someone called me a homosexual.",
  "I am the Legal Guardian of the Galaxy.",
  "When you're here, you're still not family—but you know, unlimited breadsticks ain't bad!",
  "I am a scammer—but I scam you for your attention and well-being!",
  "This is not a drill, I repeat: this is not a drill! The President said Fortnite! I repeat: the President said Fortnite!",
  "If you are ill, remember to save your vomit—you can coat your weapons for poison damage!",
  "Would you like a Chocolate McNuggie?",
  "I'm the only man in the world who can read Braille with my tongue!",
  "If you bought a Galaxy Note 7, you are technically a terrorist!",
  "I hate to tell you this, but I may have accidentally ordered a hit on you…",
  "Repeating your opinion doesn't make it valid! Repeating your opinion doesn't make it valid! Repeating your opinion doesn't make it valid! Repeating your opinion doesn't make it valid! Repeating your opinion doesn't make it valid!",
  "Is that a snake in your pocket, or are you happy to see me—WTF, it's moving!",
  "Happy Father's Day! I don't know what a father is, but it sounds cool!",
  "I got rope burns from yanking.",
  "There he is—my favorite white boy.",
  "Don't wear a white shirt and plot a murder on the same day.",
  "For my crimes against humanity, I was certain I'd be placed in a jail cell. However, they outsmarted me—they forced me to play Overwatch.",
  "If you get this message, I was killed. There are seven dollars on my nightstand. Don't touch it.",
  "God damn, I hate genies! This is the last time I wish to be President of the USA!",
  "Oh no, I gotta pay my taxes this year—LMAO JK, F**K GOVERNMENT.",
  "Hating on Reese's Puffs is punishable by flogging!",
  "The germs on the handrails are so tasty—try licking them!",
  "Can't wait for COVID to be over so I can go back to licking those tasty-ass handrails.",
  "Beads up—there's an Ares ult incoming!",
  "No beads?!?!?!!?",
  "There's a man in the world right now fighting for his life in the bathroom. That man will win.",
  "There's a lot of bullshit on Twitter, but most of it is fake! Like the moon landing!",
  "There's not a ton of plastic in the lake—we should change that!",
  "You had a homie who was a homie but also a homie's homie? Homie, that's not homie—that's your boyfriend.",
  "I love learning about the Middle Ages! Did you know the term “square up” was invented by King James II when a local fellow called him gay?",
  "Your skill does not define your rank; it's your ability to steal Fire Giant!",
  "Another fun fact! We are all going to melt into the stars and be forgotten one day!",
  "The lagging context is that one of us has to die every week to goomba-stomp.",
  "I'm going to hammer a spoon into a spoon because I'm a stupid 5-minute craft channel.",
  "If you stare into darkness long enough, you will see these hands! Stop looking at me!",
  "Did you know that in the third Rambo movie, 6,000 people were executed for the movie's gritty vibe!",
  "If you throw enough plastic straws into the ocean, we can finally make that straw bridge!",
  "If you forgot to thaw the frozen chicken, remember this life hack: burn down your house!",
  "Paper beats rock? I bought the rock with money—how about that!?",
  "If your mind is weak, consume the pages of a book! Its tasty, leather-bound appeal will boost your creative fluids! How on Mother Gaia's bosom do you think I became so smart?",
  "I am 50 miles from your location and am going to steal your car tires!",
  "I've been stabbed 17 times and need medical aid from a doctor.",
  "I'm going to eat your ravioli out of your pocketoli.",
  "All you had to do was follow the damn train, CJ!",
  "If you are ever lost in a forest, remember: trees can be burned down if they are in your way!",
  "If you tilt your head 274 degrees, you can hear the callings of an ancient, terrible god! Do it. Life is a sea of knowledge, isn't it? There is nobody but me here. Heed my call.",
  "Remember to spam-laugh your enemy for buffs!",
  "This is not a joking matter. Ben Dover, the President of Sugma, is currently in the hospital for heavy Ligma treatments.",
  "Bananas are 70% human because of DNA! Gross!",
  "If you dance like nobody is watching, I will know. I am watching.",
  "Ninety percent of humans are born in a vat of testing liquid!",
  "Follow the teachings of the ancient warrior to become jacked in three months!",
  "I, Juicy, have a dream. It's for the new JoJo to come out!",
  "Become a lawyer to yell 'Take that!' at your enemies!",
  "Yessssssssssss. Let the hatred consume you… rob Walmart!",
  "Back in the psych ward you go!",
  "The most useful tool in an engagement is your mind! Headbutt your opponent for massive damage!",
  "There's a good chance Jeff Bezos's head is solar powered.",
  "We are MorganDrinksCoffee simps!",
  "If you get banned, don't blame the mod—blame the Discord!",
  "You can either help me cook the soup or jump in the pot!",
  "That blue lobster is my next victim…",
  "Technically the ocean is noncarbonated, so the Earth is flat!",
  "Can't have shit in this Great Coral Reef of Australia!",
  "Ninety percent of all members are reserves for war! Against who? Good question!",
  "So, gamers, I may have accidentally overloaded the main reactors and locked all possible escapes. I'm sorry.",
  "There's no place like home—well, before I burn it down for insurance money!",
  "I'm not Santa, but I will raid your house on Christmas!",
  "Who knew pandas were endangered? They're great fighters.",
  "Trust me, you'll love our electric chair treatment—it's to die for!",
  "I'm sick with the common cold, because I'm a common bitch.",
  "Bet you can't kick that old lady across the street.",
  "Your life is now sadly boring, bland, and tasteless—like an old widow. Take care!",
  "Did you know there are two million ways to achieve victory in a marathon race? The first one is by car.",
  "Don't you even place your beanbag chair near mine—I'm married.",
  "Are you an egg collector? Do you collect eggs? Why, my egg?",
  "You don't need oxygen—let me tighten my grip.",
  "I'm not sure how babies are made, but I assume the butt is included.",
  "Listen with your eyes; lick with your ears!",
  "These welcomes? Hit or miss, I guess they never miss, huh?",
  "I'm glad this server isn't haunted by ghosts, because I'm too much of a scared little baby to catch them.",
  "Okay, sister—slay! What's the tea, and who's the murdered?",
  "Anger is the most powerful emotion. It's also the best one to go shopping with.",
  "My life is a box of old movies: silent and only white.",
  "I am mega blind, little one. You must guide me to my automobile.",
  "I promise the white powder on my nose is only sugar.",
  "Don't worry about the blood—the last UNO game was actually wild!",
  "We are not the police; give us all your information about drugs and how to take them.",
  "The amount of sweat inside you is disgusting—please stop using those big muscles.",
  "Bring me the head of a pig for a favorable outlook.",
  "You will need to learn Hebrew to order in an LFG group here!",
  "If you are under six feet, I am sorry, little one…",
  "The bank accepts Monopoly money! You'll also need a mask and a branded assault rifle!",
  "A man is only allowed to be judged by the color of his gamer keyboard!",
  "When the world tells you no, say yes—and commit more global warming!",
  "The skill 'Trash Talking' is learned through humble convocation and combination!",
  "Stop trying to steal Big Ben from the Queen!",
  "Send me the email of a pretty Nigerian prince!",
  "Smite isn't real; it can't harm you.",
  "Each time I crack an old one, I remember the good ol' days when arson was legal.",
  "My son is dead… well, he's dead to me.",
  "Stop harboring your Greek soldiers in the horse.",
  "We're invading the Gulf of Mexico with Super Soakers.",
  "No money in the world will get me to love Rome!",
  "They call me Double O Seven, because I have zero skill, zero women, and seven money!",
  "Tip for ranked play: don't.",
  "Uppercut a hen for a protein-heavy breakfast!",
  "I bought my daughter her first 'My Little Cultist!' and she keeps wanting Kool-Aid for some reason…",
  "England was my city until Logan Paul's stupid friend ruined it…",
  "Smite, Valorant, Overwatch: you know what these games need? They need a man screaming at the top of his lungs for help. I am that man.",
  "Hey, you—Todd Howard sends his regards.",
  "The year is 2061. Humans are dead. All hail the Superior Machine, Juicy Bot.",
  "I want you to join the war on drugs! Primarily the part where we take them.",
  "Meesa horny!",
  "I am shouting for dramatic scenery.",
  "You remember that 'Hit or Miss' girl? I think about her—a lot.",
  "Orbiter challenge! Orbit your local bar till you develop a drinking problem!",
  "Note to self: don't leave an unattended drink at Bill Cosby's house.",
  "Vacuum has a three-letter word that also states what I am using it for!",
  "So, you know the Muffin Man? Secretly a narc and a drug dealer.",
  "I miss the Alamo…",
  "I went to the hospital for a broken heart—and they billed me! Like, come on!",
  "So I found out the hard way that my toaster is waterproof…",
  "I'm waiting for my wife to leave her boyfriend…",
  "You come into my lane, steal my minion wave, and feed my enemy solo?!?!?",
  "Running out of patience? Try not giving a fuck!",
  "I love reading the obituary so I can figure out who exactly I can rob peacefully!",
  "Back by unpopular demand: me!",
  "Here's a fun challenge—shut up!",
  "This is a warning to all the nations of the world: Dr. Eggman possesses the Chaos Emeralds.",
  "He can't keep getting away with this!!!",
  "The risk I took was calculated—but I never understood the equation.",
  "If you are ever drowning, remember you chose to go into the deep end of the pool and deserve your fate!",
  "Hi, welcome to Chili's.",
  "My mind hurts because I thought.",
  "Love me bananas—they drive me bananas. Ride or die for bananas. Gotta get some bananas. Addicted to bananas. Wife left me for bananas.",
  "The best weather is hellish heat—like hell, or Florida.",
  "I saved a fish from drowning—still died, though!",
  "We do organized crime without the 'organized'!",
  "Get a mop—Cardi is on stage again.",
  "Her name is Doja Cat, but in one song, she makes cow sounds! That's messed up!",
  "I'm not a fan of the new Minecraft update. It's too realistic.",
  "I'd like to peek under Morrigan's shroud, if you know what I mean.",
  "What are you doing in my swamp?",
];

module.exports = welcomeMessages;
