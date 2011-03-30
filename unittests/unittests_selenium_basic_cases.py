from selenium import selenium
import unittest, time, re
import testlib


class test_login(unittest.TestCase):
	def setUp(self):
		self.verificationErrors = []
		self.selenium = selenium("127.0.0.2", 4444, "*chrome", testlib.base_url)
		self.selenium.start()
    
	def test_test_login(self):
		sel = self.selenium
		sel.open("/#!Login%20Page")
		sel.type("login_id", "Administrator")
		sel.type("password", "admin")
		sel.click("remember_me")
		sel.click("//div[@id='login_wrapper']/table/tbody/tr[5]/td[2]/button")
		assert(sel.get_cookie_by_name('sid'))
		
	def test_test_download_backup(self):
		sel = self.selenium
		sel.open("/v170/index.cgi?")
		sel.wait_for_page_to_load("30000")
		sel.click("//div[@id='body_div']/div[2]/div/div/table/tbody/tr/td[2]/ul/li[6]/div/div/div[3]")
		sel.wait_for_page_to_load("30000")
		sel.click("link=clicking here")
		sel.wait_for_page_to_load("30000")
		
		
	def test_test_modify_page_description(self):
		sel = self.selenium
		sel.open("/#!Getting%20Started/DocType")
		sel.click("//div[@id='body_div']/div[2]/div/div/table/tbody/tr/td[2]/ul/li[4]/div/div/div[1]/table/tbody/tr/td[1]")
		sel.click("//div[@id='body_div']/div[3]/div[4]/table/tbody/tr/td[2]/div/div[2]/div[3]/div/div[2]/div[3]/div[5]/div/div[1]/div[2]/div[2]/table/tbody/tr/td[1]/div[2]/div[9]/div/span[1]/input")
		sel.click("//div[@id='body_div']/div[3]/div[4]/table/tbody/tr/td[2]/div/div[2]/div[3]/div/div[2]/div[3]/div[5]/div/div[1]/div[2]/div[2]/table/tbody/tr/td[1]/div[2]/div[11]/div/span[1]/input")
		sel.click("//div[@id='body_div']/div[3]/div[4]/table/tbody/tr/td[2]/div/div[2]/div[3]/div/div[2]/div[3]/div[1]/div/div/div[3]/button[1]")
		sel.click("//div[5]/div[1]/table/tbody/tr/td[2]/img")
		sel.click("//div[@id='body_div']/div[3]/div[4]/table/tbody/tr/td[2]/div/div[2]/div[3]/div/div[2]/div[3]/div[5]/div/div[1]/div[2]/div[2]/table/tbody/tr/td[1]/div[2]/div[9]/div/span[1]/input")
		sel.click("//div[@id='body_div']/div[3]/div[4]/table/tbody/tr/td[2]/div/div[2]/div[3]/div/div[2]/div[3]/div[1]/div/div/div[3]/button[1]")
		sel.click("//div[5]/div[1]/table/tbody/tr/td[2]/img")
		sel.click("//div[@id='body_div']/div[2]/div/div/table/tbody/tr/td[2]/ul/li[6]/div/div/div[1]")
		sel.click("//div[3]/div[2]/div[2]/table/tbody/tr/td[2]/button")
		sel.click("//div[@id='body_div']/div[3]/div[4]/table/tbody/tr/td[2]/div/div[2]/div[3]/div/div[2]/div[3]/div[1]/div/div/div[1]/table/tbody/tr/td[2]/button")
		sel.click("//div[@id='body_div']/div[2]/div/div/table/tbody/tr/td[2]/ul/li[4]/div/div/div[1]/table/tbody/tr/td[2]")
		sel.click("//div[@id='body_div']/div[3]/div[4]/table/tbody/tr/td[2]/div/div[2]/div[3]/div/div[2]/div[3]/div[5]/div/div[1]/div[2]/div[2]/table/tbody/tr/td[2]/div[2]/div[2]/div/span[1]/input")
		sel.click("//div[@id='body_div']/div[3]/div[4]/table/tbody/tr/td[2]/div/div[2]/div[3]/div/div[2]/div[3]/div[1]/div/div/div[3]/button[1]")
		sel.type("//div[@id='body_div']/div[3]/div[4]/table/tbody/tr/td[2]/div/div[2]/div[3]/div/div[2]/div[3]/div[5]/div/div[4]/div[2]/div[2]/table/tbody/tr/td/div[2]/div/div[2]/textarea", "Blah...blah....test string")
		sel.click("//div[@id='body_div']/div[3]/div[4]/table/tbody/tr/td[2]/div/div[2]/div[3]/div/div[2]/div[3]/div[6]/button")

	def test_test_control_panel_server_code(self):
		sel = self.selenium
		sel.open("/#!Getting%20Started/Control%20Panel")
		sel.click("//div[@id='body_div']/div[2]/div/div/table/tbody/tr/td[2]/ul/li[5]/div/div/div[2]")
		sel.type("code-1", "msgprint(webnotes.conn.cur_db_name)")
		sel.click("//div[@id='body_div']/div[3]/div[4]/table/tbody/tr/td[2]/div/div[2]/div[3]/div/div/div[3]/div[5]/div/div[9]/div[2]/div[2]/table/tbody/tr/td/div[2]/div[1]/div[2]/span[2]/button")
		sel.click("//div[5]/div[1]/table/tbody/tr/td[2]/img")
	
	def tearDown(self):
		self.selenium.stop()
		self.assertEqual([], self.verificationErrors)

