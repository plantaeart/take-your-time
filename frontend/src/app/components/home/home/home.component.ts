import { Component } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { TopPageComponent } from "../../ui/top-page/top-page.component";
import { useAuthState, useAuthActions } from "../../../hooks/auth.hooks";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule, TopPageComponent],
})
export class HomeComponent {
  public readonly appTitle = "TAKE YOUR TIME";
  
  // Auth hooks
  private authState = useAuthState();
  private authActions = useAuthActions();
  
  // Expose auth state to template
  user = this.authState.user;
  userDisplayName = this.authState.userDisplayName;
  
  // Logout action
  logout = this.authActions.logout;
}
