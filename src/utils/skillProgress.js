export default function skillProgress(user) {

  if (!user.skills || user.skills.length === 0) {
    return [];
  }

  return user.skills.map((skill) => {

    const level = Number(skill.level || 1);

    let percentage = 0;

    switch (level) {
      case 1:
        percentage = 20;
        break;

      case 2:
        percentage = 40;
        break;

      case 3:
        percentage = 60;
        break;

      case 4:
        percentage = 80;
        break;

      case 5:
        percentage = 100;
        break;

      default:
        percentage = 20;
    }

    let status = "";

    if (percentage === 100) {
      status = "Expert";
    } else if (percentage >= 80) {
      status = "Advanced";
    } else if (percentage >= 60) {
      status = "Intermediate";
    } else if (percentage >= 40) {
      status = "Beginner";
    } else {
      status = "Learning";
    }

    return {
      name: skill.name,
      level,
      percentage,
      status,
    };
  });

}