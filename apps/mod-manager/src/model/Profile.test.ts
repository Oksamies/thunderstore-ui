import { beforeAll, describe, expect, it } from "vitest";

import ProfileProvider from "../providers/ProfileProvider";
import DummyProfileProvider from "../providers/impl/DummyProfileProvider";
import PathResolver from "../r2mm/manager/PathResolver";
import Profile, { ImmutableProfile } from "./Profile";

describe("Profile", () => {
  beforeAll(() => {
    PathResolver.MOD_ROOT = "/mock/mod/root";
    ProfileProvider.provide(() => new DummyProfileProvider());
  });

  it("should create profile and set active", () => {
    const profile = new Profile("Default");
    expect(Profile.getActiveProfile()).toBe(profile);
    expect(profile.getProfileName()).toBe("Default");
  });

  it("should resolve paths correctly", () => {
    const profile = new Profile("TestProfile");
    // Ensure active profile is updated
    expect(Profile.getActiveProfile()).toBe(profile);

    const path = profile.getProfilePath();
    // path-browserify uses / as separator generally
    expect(path).toContain("profiles");
    expect(path).toContain("TestProfile");
  });

  it("should support immutable profile", () => {
    // Active is TestProfile from previous test
    const immutable = Profile.getActiveAsImmutableProfile();
    expect(immutable).toBeInstanceOf(ImmutableProfile);
    expect(immutable.getProfileName()).toBe("TestProfile");
  });
});
