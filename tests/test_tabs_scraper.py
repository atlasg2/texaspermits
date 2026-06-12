import unittest

from scraper.tabs_scraper import to_int


class ToIntTests(unittest.TestCase):
    def test_currency(self):
        self.assertEqual(to_int("$3,500,000"), 3_500_000)

    def test_square_footage_ignores_unit_exponent(self):
        self.assertEqual(to_int("55,525 ft 2"), 55_525)

    def test_small_square_footage(self):
        self.assertEqual(to_int("294 ft 2"), 294)

    def test_blank(self):
        self.assertIsNone(to_int(""))


if __name__ == "__main__":
    unittest.main()
