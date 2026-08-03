Feature: Reaching the site on any device

  @critical @regression
  Scenario: The page never scrolls sideways on a phone
    Given a visitor on a mobile viewport
    When the page has finished laying out
    Then the document is no wider than the screen

  @a11y @critical
  Scenario Outline: Key states have no detectable accessibility violations
    Given the visitor is on <state>
    Then an automated accessibility scan reports no serious or critical violations

    Examples:
      | state                        |
      | the home page                |
      | the call modal consent step  |
      | the call modal during a call |
