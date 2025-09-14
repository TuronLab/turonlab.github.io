# My Portfolio

Hi there! My name is Pablo Turón, and this is the portfolio I built to showcase what has kept me entertained over the past few years. I'm an AI engineer with a background in telecommunications engineering and experience in AI research projects. Dive in to discover more!

> **Note.** Dear web pros, avert your eyes! This humble creation is my first proper site. ChatGPT and I wrestled the code into shape during a few after-work evenings—so treat it kindly!

## Usage

You can launch this app using any method you prefer. For me, the quickest way was to start a simple local server:

```bash
cd /path/to/your/portfolio
python -m http.server 8000
```

### Customize

I tried to make this portfolio project as easy as posible to customaize it and update it, allowing you to update it by using `jsons` pointing to different html files and images. Thus, you will be able
to modify the behaviour of the page by using the jsons in the **[display_conf](display_conf)** directory, with the following configuration json paths:

- **[menu.json](display_conf/menu.json)**: It's a list of dicts that manages the amount of options showed in the menu, and controls the `name`, `id`, and the path to the `html file` to load when you click on it.
- **[about.json](display_conf/about.json)**: As I wanted to show up more detail about how I applied different techonlogies to my sport, I decided to build a multi-page pop-up controlled with this json. It expects an `id`, `title`, and a list of paths with the html files to load by pop-up page.
- **[projects.json](display_conf/projects.json)** and **[activities.json](display_conf/activities.json)**: These jsons will manage what projects will show up in a grid of cards fashion when you click on the projects option or the activities option. This cards will generate a pop-up showing the desired `html file`. It is composed by a list of jsons where you have to set the `title` of the card, the path to the `thumbnail`to show, and the html file to load by using the `content` field. Optionally, you can set the boolean value `fitToWidth` to false, in the case of you want to zoom your image to occupy the entire block. Moreover, you can also use the field `comingSoon` to mark the card as coming soon, blocking the usage of the card.

The rest of the project provides the standard website framework and structure.