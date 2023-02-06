<?php    
    require_once "../libs/dbauth.php"; 
    require_once "../utils/config.php"; 

    session_start();
	if (!isset($_SESSION['username'])) {
		header("Location: login.php");
		session_destroy();
	}

    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $accion = "";
        $err = false;
        $resp = true;
        $response = array("ok" => false, "error" => "Error desconocido", "data_post" => json_encode($_POST));
        
        if (isset($_POST["accion"])) $accion = $_POST["accion"];

        if (!$err) {
            if ($accion == "crear-cuenta") {
                if (!isset($_POST["nombre_user"])) {
                    $response = array("ok" => false, "error" => "No se han recibido los parametros correctos, contacta con el equipo de programación", "data_post" => json_encode($_POST));
                    $err = true;
                } else {
                    $usuarioNuevo_nombre = $_POST["nombre_user"];
                    $usuarioNuevo_rol = "user";
                    $usuarioNuevo_psswd = randomPassword();
                }
                
                $sql = MySql_Execute("INSERT INTO panel_users (`username`, `psswd`, `rol`) VALUES ('".$usuarioNuevo_nombre."', '".$usuarioNuevo_psswd."', '".$usuarioNuevo_rol."');");
                
                if ($sql) { $response = array("ok" => false, "error" => "Error en la consulta SQL, ".$sql.", contacta con el equipo de programación.", "data_post" => json_encode($_POST)); } 
                else { $response = array("ok" => true, "error" => "N/A", "data_post" => json_encode($_POST)); }
        
            } else if ($accion == "unock-level2") {
                $Level = $_POST["nivel"];
                $sql = MySql_Execute("UPDATE levels SET level_2 = 1 WHERE id = '".$_SESSION['id']."'");
                if ($sql) { $response = array("ok" => false, "error" => "Error en la consulta SQL, ".$sql.", contacta con el equipo de programación.", "data_post" => json_encode($_POST)); } 
                else { $response = array("ok" => true, "error" => "N/A", "data_post" => json_encode($_POST)); }
            } else if ($accion == "unock-level3") {
                $Level = $_POST["nivel"];
                $sql = MySql_Execute("UPDATE levels SET level_3 = 1 WHERE id = '".$_SESSION['id']."'");
                if ($sql) { $response = array("ok" => false, "error" => "Error en la consulta SQL, ".$sql.", contacta con el equipo de programación.", "data_post" => json_encode($_POST)); } 
                else { $response = array("ok" => true, "error" => "N/A", "data_post" => json_encode($_POST)); }
            } else if ($accion == "eliminar-cuenta-staff") { 
                if (!isset($_POST["idstaff"])) {
                    $response = array("ok" => false, "error" => "No se han recibido los parametros correctos, contacta con Micky#7112", "data_post" => json_encode($_POST));
                    $err = true;
                } else { $idStaff = $_POST["idstaff"]; }
                
                $sql = MySql_Execute('DELETE FROM mck_panel_users WHERE id = "'.$idStaff.'"');
                
                if ($sql) { 
                    $response = array("ok" => false, "error" => "Error en la consulta SQL, ".$sql.", contacta con Micky#7112.", "data_post" => json_encode($_POST));
                } else {
                    $response = array("ok" => true, "error" => "N/A", "data_post" => json_encode($_POST)); 
                }
            }
        }

        if ($resp) echo json_encode($response);
    }

    function randomPassword() {
        $alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
        $pass = array();
        $alphaLength = strlen($alphabet) - 1;
        for ($i = 0; $i < 8; $i++) {
            $n = rand(0, $alphaLength);
            $pass[] = $alphabet[$n];
        }
        return implode($pass);
    }
?>