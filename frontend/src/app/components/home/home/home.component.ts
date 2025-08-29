import { Component } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { TopPageComponent } from "../../ui/top-page/top-page.component";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
  standalone: true,
  imports: [CardModule, ButtonModule, TopPageComponent],
})
export class HomeComponent {
  public readonly appTitle = "ALTEN SHOP";
}
