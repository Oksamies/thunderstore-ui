import { PackageHeader } from "@thunderstore/components";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import React from "react";

const meta = { component: PackageHeader } as ComponentMeta<
  typeof PackageHeader
>;

const Template: ComponentStory<typeof PackageHeader> = (props) => (
  <PackageHeader {...props} />
);

const Header = Template.bind({});
Header.args = {
  communityName: "Risk of Rain 2",
  description:
    "Adds the CHEF robot from RoR1 as a survivor. Multiplayer-compatible!",
  imageSrc: "https://api.lorem.space/image/game?w=256&h=256",
  packageName: "ChefMod",
  tags: [
    { id: "1", label: "Mods" },
    { id: "2", label: "Player Characters" },
  ],
  teamName: "Gnome",
  url: "https://github.com/GnomeModder/ChefMod",
};

export { meta as default, Header as PackageHeader };