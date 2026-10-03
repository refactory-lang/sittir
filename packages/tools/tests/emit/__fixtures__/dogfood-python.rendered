"""Simple user management module."""

from typing import Optional


class User:
    def __init__(self, user_id: int, name: str) -> None:
        self.user_id = user_id
        self.name = name

    def greet(self) -> str:
        return f"Hello, {self.name}!"


def find_user(users: list, user_id: int) -> Optional[User]:
    for user in users:
        if user.user_id == user_id:
            return user
    return None
