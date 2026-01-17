import VersionNumber from "../model/VersionNumber";

export default class ManagerInformation {
  public static VERSION: VersionNumber = new VersionNumber("0.0.1");
  public static IS_PORTABLE: boolean = false;
  public static APP_NAME: string = "Thunderstore Mod Manager";
}
