try {
    var fso = new ActiveXObject("Scripting.FileSystemObject");
    var file = fso.OpenTextFile("frontend/home.js", 1);
    var content = file.ReadAll();
    file.Close();
    eval(content);
    WScript.Echo("Syntax OK!");
} catch (e) {
    WScript.Echo("Error: " + e.message + " at line " + (e.line || "unknown"));
}
