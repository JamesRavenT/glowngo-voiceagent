Feature: Placing a call

  @regression
  Scenario: Clicking away minimizes an ongoing call instead of ending it
    Given a call is in progress
    When the caller clicks the area outside the call modal
    Then the call modal closes
    And the floating call button reports a call in progress
    And the call is still in progress
