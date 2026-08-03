# Visual baselines are OS- and font-specific. These local Windows baselines are informational
# until a canonical Linux CI image owns them.
Feature: Targeted visual regression checks

  @visual
  Scenario: The hero retains its approved presentation
    Given the visitor is on the home page
    Then the hero section matches its visual baseline

  @visual
  Scenario: The call modal retains its approved consent presentation
    Given the visitor is on the call modal consent step
    Then the call modal consent state matches its visual baseline
