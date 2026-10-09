import alpha_module, beta_module, gamma_module, delta_module, epsilon_module
from package.module import (first_name, second_name, third_name, fourth_name)
from package.module import first_name, second_name, third_name, fourth_name


def compute(first_argument, second_argument, third_argument=None, *rest, **options):
    result = transform(first_argument, second_argument, key=third_argument, flag=True)
    values = [first_argument, second_argument, third_argument, rest, options]
    mapping = {"first": first_argument, "second": second_argument, "third": third_argument}
    left, right = first_argument, second_argument
    return result, values, mapping
