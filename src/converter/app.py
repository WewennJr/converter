import json
import math
import time
from pathlib import Path

import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

BASE_DIR = Path(__file__).parent
TRANSLATIONS_DIR = BASE_DIR / "translations"


def get_language():
    return request.accept_languages.best_match(["fr", "en"]) or "en"


def get_translations(language):
    translation_file = TRANSLATIONS_DIR / f"{language}.json"

    with translation_file.open("r", encoding="utf-8") as file:
        return json.load(file)


CONVERSIONS = {
    "length": {
        "units": ["mm", "cm", "m", "km", "in", "ft", "yd", "mi", "nmi", "µm", "nm"],
        "base": "m",
        "factors": {
            "mm": 0.001,
            "cm": 0.01,
            "m": 1,
            "km": 1000,
            "in": 0.0254,
            "ft": 0.3048,
            "yd": 0.9144,
            "mi": 1609.344,
            "nmi": 1852,
            "µm": 1e-6,
            "nm": 1e-9,
        },
    },
    "weight": {
        "units": ["mg", "g", "kg", "t", "oz", "lb", "st"],
        "base": "kg",
        "factors": {
            "mg": 1e-6,
            "g": 0.001,
            "kg": 1,
            "t": 1000,
            "oz": 0.028349523125,
            "lb": 0.45359237,
            "st": 6.35029318,
        },
    },
    "temperature": {
        "units": ["°C", "°F", "K", "°R"],
        "base": "K",
        "special": True,
    },
    "volume": {
        "units": ["mL", "L", "m³", "cm³", "gal", "qt", "pt", "cup", "fl oz", "tbsp", "tsp"],
        "base": "L",
        "factors": {
            "mL": 0.001,
            "L": 1,
            "m³": 1000,
            "cm³": 0.001,
            "gal": 3.78541,
            "qt": 0.946353,
            "pt": 0.473176,
            "cup": 0.236588,
            "fl oz": 0.0295735,
            "tbsp": 0.0147868,
            "tsp": 0.00492892,
        },
    },
    "area": {
        "units": ["mm²", "cm²", "m²", "km²", "in²", "ft²", "yd²", "mi²", "acre", "ha"],
        "base": "m²",
        "factors": {
            "mm²": 1e-6,
            "cm²": 1e-4,
            "m²": 1,
            "km²": 1e6,
            "in²": 0.00064516,
            "ft²": 0.092903,
            "yd²": 0.836127,
            "mi²": 2.59e6,
            "acre": 4046.86,
            "ha": 10000,
        },
    },
    "speed": {
        "units": ["m/s", "km/h", "mph", "kn", "ft/s"],
        "base": "m/s",
        "factors": {
            "m/s": 1,
            "km/h": 1 / 3.6,
            "mph": 0.44704,
            "kn": 0.514444,
            "ft/s": 0.3048,
        },
    },
    "time": {
        "units": ["ns", "µs", "ms", "s", "min", "h", "d", "wk", "mo", "yr"],
        "base": "s",
        "factors": {
            "ns": 1e-9,
            "µs": 1e-6,
            "ms": 0.001,
            "s": 1,
            "min": 60,
            "h": 3600,
            "d": 86400,
            "wk": 604800,
            "mo": 2629746,
            "yr": 31556952,
        },
    },
    "data": {
        "units": ["B", "KB", "MB", "GB", "TB", "PB", "KiB", "MiB", "GiB", "TiB", "PiB"],
        "base": "B",
        "factors": {
            "B": 1,
            "KB": 1000,
            "MB": 1e6,
            "GB": 1e9,
            "TB": 1e12,
            "PB": 1e15,
            "KiB": 1024,
            "MiB": 1024**2,
            "GiB": 1024**3,
            "TiB": 1024**4,
            "PiB": 1024**5,
        },
    },
    "energy": {
        "units": ["J", "kJ", "MJ", "Wh", "kWh", "cal", "kcal", "eV", "BTU"],
        "base": "J",
        "factors": {
            "J": 1,
            "kJ": 1000,
            "MJ": 1e6,
            "Wh": 3600,
            "kWh": 3.6e6,
            "cal": 4.184,
            "kcal": 4184,
            "eV": 1.602176634e-19,
            "BTU": 1055.06,
        },
    },
    "power": {
        "units": ["W", "kW", "MW", "GW", "hp", "BTU/h"],
        "base": "W",
        "factors": {
            "W": 1,
            "kW": 1000,
            "MW": 1e6,
            "GW": 1e9,
            "hp": 745.699872,
            "BTU/h": 0.29307107,
        },
    },
    "pressure": {
        "units": ["Pa", "kPa", "MPa", "bar", "atm", "psi", "mmHg", "inHg"],
        "base": "Pa",
        "factors": {
            "Pa": 1,
            "kPa": 1000,
            "MPa": 1e6,
            "bar": 100000,
            "atm": 101325,
            "psi": 6894.757293,
            "mmHg": 133.322368,
            "inHg": 3386.389,
        },
    },
    "force": {
        "units": ["N", "kN", "MN", "dyn", "lbf", "kgf"],
        "base": "N",
        "factors": {
            "N": 1,
            "kN": 1000,
            "MN": 1e6,
            "dyn": 1e-5,
            "lbf": 4.448221615,
            "kgf": 9.80665,
        },
    },
    "frequency": {
        "units": ["Hz", "kHz", "MHz", "GHz", "THz"],
        "base": "Hz",
        "factors": {
            "Hz": 1,
            "kHz": 1e3,
            "MHz": 1e6,
            "GHz": 1e9,
            "THz": 1e12,
        },
    },
    "angle": {
        "units": ["deg", "rad", "grad", "arcmin", "arcsec", "turn"],
        "base": "rad",
        "factors": {
            "deg": math.pi / 180,
            "rad": 1,
            "grad": math.pi / 200,
            "arcmin": math.pi / 10800,
            "arcsec": math.pi / 648000,
            "turn": 2 * math.pi,
        },
    },
    "electricity": {
        "special": True,
        "calculator": True,
    },
    "illuminance": {
        "units": ["lx", "fc", "phot"],
        "base": "lx",
        "factors": {
            "lx": 1,
            "fc": 10.7639,
            "phot": 10000,
        },
    },
    "fuel": {
        "units": ["km/L", "L/100km", "mpg US", "mpg UK"],
        "base": "km/L",
        "special": True,
    },
    "cooking": {
        "units": ["mL", "L", "cup", "tbsp", "tsp", "fl oz"],
        "base": "mL",
        "factors": {
            "mL": 1,
            "L": 1000,
            "cup": 236.588,
            "tbsp": 14.7868,
            "tsp": 4.92892,
            "fl oz": 29.5735,
        },
    },
    "number_base": {
        "units": ["Decimal", "Binary", "Octal", "Hexadecimal"],
        "base": "Decimal",
        "special": True,
    },
    "currency": {
        "units": [],
        "base": "EUR",
        "dynamic": True,
    },
}


CURRENCY_CACHE = {}
CACHE_TIMESTAMP = 0
CACHE_DURATION = 3600


def fetch_currency_rates():
    global CURRENCY_CACHE, CACHE_TIMESTAMP

    current_time = time.time()

    if CURRENCY_CACHE and current_time - CACHE_TIMESTAMP < CACHE_DURATION:
        return CURRENCY_CACHE

    try:
        response = requests.get(
            "https://api.exchangerate-api.com/v4/latest/EUR",
            timeout=5,
        )
        response.raise_for_status()

        data = response.json()
        rates = data.get("rates", {})

        if rates:
            rates["EUR"] = 1.0
            CURRENCY_CACHE = rates
            CACHE_TIMESTAMP = current_time
            CONVERSIONS["currency"]["units"] = sorted(rates.keys())
            return CURRENCY_CACHE

    except (requests.RequestException, ValueError):
        pass

    if CURRENCY_CACHE:
        return CURRENCY_CACHE

    CURRENCY_CACHE = {
        "EUR": 1.0,
        "USD": 1.08,
        "GBP": 0.85,
        "JPY": 165.0,
        "CHF": 0.96,
        "CAD": 1.48,
        "AUD": 1.65,
        "CNY": 7.85,
        "INR": 90.0,
        "BRL": 5.40,
    }

    CONVERSIONS["currency"]["units"] = sorted(CURRENCY_CACHE.keys())

    return CURRENCY_CACHE


def convert_temperature(value, from_unit, to_unit):
    to_kelvin = {
        "°C": lambda x: x + 273.15,
        "°F": lambda x: (x - 32) * 5 / 9 + 273.15,
        "K": lambda x: x,
        "°R": lambda x: x * 5 / 9,
    }

    from_kelvin = {
        "°C": lambda x: x - 273.15,
        "°F": lambda x: (x - 273.15) * 9 / 5 + 32,
        "K": lambda x: x,
        "°R": lambda x: x * 9 / 5,
    }

    kelvin = to_kelvin[from_unit](value)
    return from_kelvin[to_unit](kelvin)


def convert_fuel(value, from_unit, to_unit):
    if from_unit == to_unit:
        return value

    if from_unit == "km/L":
        km_per_liter = value
    elif from_unit == "L/100km":
        if value == 0:
            raise ValueError("Division by zero")
        km_per_liter = 100 / value
    elif from_unit == "mpg US":
        km_per_liter = value * 0.425143707
    elif from_unit == "mpg UK":
        km_per_liter = value * 0.3540061899
    else:
        raise ValueError("Invalid fuel unit")

    if to_unit == "km/L":
        return km_per_liter

    if to_unit == "L/100km":
        if km_per_liter == 0:
            raise ValueError("Division by zero")
        return 100 / km_per_liter

    if to_unit == "mpg US":
        return km_per_liter / 0.425143707

    if to_unit == "mpg UK":
        return km_per_liter / 0.3540061899

    raise ValueError("Invalid fuel unit")


def convert_number_base(value, from_unit, to_unit):
    if from_unit == to_unit:
        return value

    bases = {
        "Decimal": 10,
        "Binary": 2,
        "Octal": 8,
        "Hexadecimal": 16,
    }

    try:
        decimal_value = int(str(value), bases[from_unit])

        if to_unit == "Decimal":
            return format(decimal_value, "d")

        return format(
            decimal_value,
            {
                "Binary": "b",
                "Octal": "o",
                "Hexadecimal": "X",
            }[to_unit],
        )
    except (ValueError, TypeError):
        raise ValueError("Invalid number")


def calculate_electricity(calculation, value1, value2):
    if value1 < 0 or value2 < 0:
        raise ValueError("Values must be positive")

    if calculation == "voltage":
        return value1 * value2, "V"

    if calculation == "current":
        if value2 == 0:
            raise ValueError("Division by zero")
        return value1 / value2, "A"

    if calculation == "resistance":
        if value2 == 0:
            raise ValueError("Division by zero")
        return value1 / value2, "Ω"

    if calculation == "power":
        return value1 * value2, "W"

    raise ValueError("Unknown electricity calculation")


def convert_special(value, from_unit, to_unit, category):
    if category == "temperature":
        return convert_temperature(value, from_unit, to_unit)

    if category == "fuel":
        return convert_fuel(value, from_unit, to_unit)

    if category == "number_base":
        return convert_number_base(value, from_unit, to_unit)

    raise ValueError("Unsupported conversion")


def convert_static(value, from_unit, to_unit, category):
    conversion = CONVERSIONS[category]

    if conversion.get("special"):
        return convert_special(value, from_unit, to_unit, category)

    base_value = value * conversion["factors"][from_unit]
    return base_value / conversion["factors"][to_unit]


def convert_currency(value, from_unit, to_unit):
    rates = fetch_currency_rates()

    if from_unit not in rates or to_unit not in rates:
        return None

    eur_value = value / rates[from_unit]
    return eur_value * rates[to_unit]


@app.route("/")
def index():
    language = get_language()
    translations = get_translations(language)

    fetch_currency_rates()

    categories = {
        category: data.get("units", [])
        for category, data in CONVERSIONS.items()
    }

    return render_template(
        "index.html",
        categories=categories,
        language=language,
        translations=translations,
    )


@app.route("/api/convert", methods=["POST"])
def api_convert():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Invalid request"}), 400

    category = data.get("category")

    if not category:
        return jsonify({"error": "Missing category"}), 400

    if category not in CONVERSIONS:
        return jsonify({"error": "Unknown category"}), 400

    if category == "electricity":
        calculation = data.get("calculation")
        value1 = data.get("value1")
        value2 = data.get("value2")

        if not calculation or value1 is None or value2 is None:
            return jsonify({"error": "Missing parameters"}), 400

        try:
            value1 = float(value1)
            value2 = float(value2)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid value"}), 400

        if not math.isfinite(value1) or not math.isfinite(value2):
            return jsonify({"error": "Invalid value"}), 400

        try:
            result, unit = calculate_electricity(
                calculation,
                value1,
                value2,
            )
        except ValueError:
            return jsonify({"error": "Invalid calculation"}), 400

        return jsonify({
            "result": round(result, 10),
            "unit": unit,
        })

    value = data.get("value")
    from_unit = data.get("from_unit")
    to_unit = data.get("to_unit")

    if value is None or not from_unit or not to_unit:
        return jsonify({"error": "Missing parameters"}), 400

    if category != "currency" and from_unit not in CONVERSIONS[category]["units"]:
        return jsonify({"error": "Invalid source unit"}), 400

    if category != "currency" and to_unit not in CONVERSIONS[category]["units"]:
        return jsonify({"error": "Invalid target unit"}), 400

    if category == "number_base":
        try:
            result = convert_number_base(value, from_unit, to_unit)
        except ValueError:
            return jsonify({"error": "Invalid number"}), 400

        return jsonify({
            "result": result,
            "from": f"{value} {from_unit}",
            "to": f"{result} {to_unit}",
        })

    try:
        value = float(value)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid value"}), 400

    if not math.isfinite(value):
        return jsonify({"error": "Invalid value"}), 400

    try:
        if category == "currency":
            result = convert_currency(value, from_unit, to_unit)

            if result is None:
                return jsonify({"error": "Currency not supported"}), 400
        else:
            result = convert_static(
                value,
                from_unit,
                to_unit,
                category,
            )
    except (ValueError, ZeroDivisionError):
        return jsonify({"error": "Invalid conversion"}), 400

    result = round(result, 10)

    return jsonify({
        "result": result,
        "from": f"{value} {from_unit}",
        "to": f"{result} {to_unit}",
    })


@app.route("/api/currencies")
def api_currencies():
    fetch_currency_rates()

    return jsonify({
        "currencies": CONVERSIONS["currency"]["units"],
    })


@app.route("/api/categories")
def api_categories():
    fetch_currency_rates()

    return jsonify({
        category: data.get("units", [])
        for category, data in CONVERSIONS.items()
    })


def main():
    app.run(
        debug=True,
        host="0.0.0.0",
        port=5003,
    )


if __name__ == "__main__":
    main()