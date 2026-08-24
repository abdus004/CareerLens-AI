import { useContext } from "react";
import { ProfileContext } from "../context/ProfileContextObject";

export const useProfile = () => useContext(ProfileContext);
