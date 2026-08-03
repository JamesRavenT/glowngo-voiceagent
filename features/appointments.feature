Feature: Managing an existing appointment

  @critical @api
  Scenario: A failed cancellation leaves the appointment intact
    Given an appointment has been booked
    When a cancellation is attempted with a reference that does not exist
    Then the request is refused as not found
    And the original appointment can still be retrieved by its own reference

  @api
  Scenario: A booking tool accepts well-formed JSON regardless of content type
    Given a booking request carrying valid JSON
    When it is sent with a non-JSON content type
    Then it is accepted
