// Get all registered users
export const getUsers = () => {
  return JSON.parse(localStorage.getItem("users")) || [];
};

// Save all users
export const saveUsers = (users) => {
  localStorage.setItem("users", JSON.stringify(users));
};

// Get current logged-in user
export const getCurrentUser = () => {
  return (
    JSON.parse(localStorage.getItem("currentUser")) ||
    JSON.parse(sessionStorage.getItem("currentUser"))
  );
};

// Save current logged-in user
export const saveCurrentUser = (user, rememberMe = true) => {
  if (rememberMe) {
    localStorage.setItem(
      "currentUser",
      JSON.stringify(user)
    );
  } else {
    sessionStorage.setItem(
      "currentUser",
      JSON.stringify(user)
    );
  }
};

// Update current user and users array
export const updateCurrentUser = (newData) => {
  const currentUser = getCurrentUser();

  if (!currentUser) return null;

  const updatedUser = {
    ...currentUser,

    ...newData,

    profile: {
      ...currentUser.profile,
      ...(newData.profile || {}),
    },
  };

  localStorage.setItem(
    "currentUser",
    JSON.stringify(updatedUser)
  );

  const users = getUsers();

  const updatedUsers = users.map((user) =>
    user.id === updatedUser.id
      ? updatedUser
      : user
  );

  saveUsers(updatedUsers);

  return updatedUser;
};

// Logout
export const logoutUser = () => {
  localStorage.removeItem("currentUser");
  sessionStorage.removeItem("currentUser");
};