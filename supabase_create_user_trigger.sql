-- Create trigger to automatically assign new users to default workspace
-- This trigger runs after a new user is inserted into auth.users

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION assign_user_to_default_workspace();
