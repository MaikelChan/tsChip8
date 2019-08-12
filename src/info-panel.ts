import { IPanel, IROMInfo } from "./chip8/interfaces";

export class InfoPanel implements IPanel {
    private readonly panel: HTMLDivElement;

    constructor() {
        this.panel = document.getElementById("info-panel") as HTMLDivElement;
    }

    public Enable(): void {
        this.panel.style.display = "block";
    }

    public Disable(): void {
        this.panel.style.display = "none";
    }

    public SetInfo(info: { romInfo: IROMInfo, basePath: string } | undefined): void {
        if (info === undefined) {
            this.panel.innerHTML = "<p>No information about this ROM.</p>";
            return;
        }

        this.panel.innerHTML = "<h1>" + info.romInfo.title + "</h1>";
        this.panel.innerHTML += "<h2>Author</h2>";
        this.panel.innerHTML += "<p>" + info.romInfo.author + "</p>";
        this.panel.innerHTML += "<h2>Date</h2>";
        this.panel.innerHTML += "<p>" + info.romInfo.date + "</p>";
        this.panel.innerHTML += "<h2>Description</h2>";

        let request = new XMLHttpRequest();
        request.addEventListener("load", this.FinishDescriptionLoading);
        let path: string = "./roms/" + info.basePath + info.romInfo.fileName + ".txt";
        request.open("GET", path, true);
        request.send(null);
    }

    private FinishDescriptionLoading = (evt: Event): void => {
        let request = evt.target as XMLHttpRequest;
        if (request.readyState !== request.DONE) return;
        if (request.status !== 200) return;

        let description: string = "<p>" + request.responseText + "</p>";
        description = description.replace(/(?:\r\n|\r|\n)/g, "<br>");
        this.panel.innerHTML += description;
    }
}